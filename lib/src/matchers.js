"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var colors = require("colors");
var _a = require("jest-matcher-utils"), printReceived = _a.printReceived, printExpected = _a.printExpected;
var diff = require("jest-diff");
var structjson = require("./structjson");
function selectFulfillmentMessages(result, type, source) {
    var fulfillmentMessages = result.fulfillmentMessages.filter(function (_a) {
        var message = _a.message, platform = _a.platform;
        return message === type && platform === source;
    });
    return fulfillmentMessages;
}
exports.selectFulfillmentMessages = selectFulfillmentMessages;
function selectExampleMessage(messages, correspondingMessage) {
    if (messages.length === 0) {
        return undefined;
    }
    if (correspondingMessage) {
        return messages[0].text.text[0];
    }
}
exports.selectExampleMessage = selectExampleMessage;
/**
 * As there are currently no ways to retrieve the platform from the query result
 * we consider a response from Actions On Google if one of the fulfillment messages
 * has a platform whose value is ACTIONS_ON_GOOGLE
 */
function isActionsOnGoogle(result) {
    return result.fulfillmentMessages.some(function (message) { return message.platform === "ACTIONS_ON_GOOGLE"; });
}
exports.isActionsOnGoogle = isActionsOnGoogle;
var matchers = {
    toHaveIntent: function (result, intent) {
        var query = result.queryText;
        var matchedIntent = result.intent.displayName;
        return {
            pass: matchedIntent === intent,
            message: function () {
                return "Query: \"" + query + "\"\nExpected intent: " + printExpected(intent) + "\nReceived intent: " + printReceived(matchedIntent) + ".\n\nYou may want to check your " + "training phrases".bold + ". Make sure they are not " + "conflicting".bold + " across your intents.";
            }
        };
    },
    toHaveContext: function (result, expectedContext) {
        if (!expectedContext || Object.is(expectedContext, {})) {
            return {
                pass: false,
                message: function () {
                    return "You didn't give a context\nRefer to these docs for the format: https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions.contexts#Context.";
                }
            };
        }
        var receivedContext = result.outputContexts.find(function (context) {
            var contextName = context.name.split("contexts/")[1];
            return expectedContext.name === contextName;
        });
        if (!receivedContext) {
            return {
                pass: false,
                message: function () {
                    return "No context with name \"" + expectedContext.name.bold + "\" have been found in the output contexts. Make sure you provided one and that its name is " + "lowercased".bold + ".";
                }
            };
        }
        var formattedReceivedContext = {
            name: expectedContext.name,
            lifespanCount: receivedContext.lifespanCount,
            parameters: structjson.structProtoToJson(receivedContext.parameters)
        };
        return {
            pass: Object.is(formattedReceivedContext, expectedContext),
            message: function () {
                return "The expected context is not the same as the received one.\n\nDifference:\n" + diff(formattedReceivedContext, expectedContext);
            }
        };
    },
    toHaveText: function (result, expectedText) {
        var textMessages = selectFulfillmentMessages(result, "text");
        var correspondingMessage = textMessages.find(function (_a) {
            var text = _a.text.text;
            return text[0] === expectedText;
        });
        if (!correspondingMessage) {
            return;
        }
        var exampleMessage = selectExampleMessage(textMessages, correspondingMessage);
        if (!correspondingMessage) {
            return {
                pass: false,
                message: function () {
                    return "No such text message have been found in the fulfillment messages.\nMake sure that you're looking for " + "text only".bold + " and not text in cards or custom payloads for example." + (exampleMessage
                        ? "\nHere is one of the text messages displayed:\n\n" +
                            colors.blue("\"" + exampleMessage + "\"")
                        : "");
                }
            };
        }
        return {
            pass: true
        };
    },
    toHaveOneOfTexts: function (result, expectedTextArray) {
        var textMessages = selectFulfillmentMessages(result, "text");
        var correspondingMessage = textMessages.find(function (_a) {
            var text = _a.text.text[0];
            return expectedTextArray.includes(text);
        });
        if (!correspondingMessage) {
            return;
        }
        var exampleMessage = selectExampleMessage(textMessages, correspondingMessage);
        if (!correspondingMessage) {
            return {
                pass: false,
                message: function () {
                    return "No such text message have been found in the fulfillment messages.\nMake sure that you're looking for " + "text only".bold + " and not text in cards or custom payloads for example." + (exampleMessage
                        ? "\nHere is one of the text messages displayed:\n\n" +
                            colors.blue("\"" + exampleMessage + "\"")
                        : "");
                }
            };
        }
        return {
            pass: true
        };
    },
    toHaveQuickReplies: function (result, expectedQuickReplies) {
        var quickRepliesArray = selectFulfillmentMessages(result, "quickReplies");
        if (quickRepliesArray.length === 0) {
            return {
                pass: false,
                message: function () { return colors.red("There are no quick replies in the response."); }
            };
        }
        var quickReplies = quickRepliesArray[0].quickReplies.quickReplies;
        return {
            pass: Object.is(quickReplies, expectedQuickReplies),
            message: function () {
                return "The expected quick replies are different from the received ones:\n\n" + diff(quickReplies, expectedQuickReplies) + ".\n\nMake sure you provided the quick replies " + colors.bold("in the right order.");
            }
        };
    },
    toHaveCard: function (result, expectedCard) {
        var cardArray = selectFulfillmentMessages(result, "card");
        if (cardArray.length === 0) {
            return {
                pass: false,
                message: function () { return colors.red("There are no cards in the response."); }
            };
        }
        var card = cardArray[0].card;
        return {
            pass: Object.is(card, expectedCard),
            message: function () {
                return "The expected card is different from the received one:\n\n" + diff(card, expectedCard) + ".";
            }
        };
    }
};
module.exports = matchers;
