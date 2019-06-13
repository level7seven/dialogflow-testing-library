import * as dialogflow from "dialogflow";
import * as colors from "colors";

const equals = (obj1: any, obj2: any): Boolean =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(key => obj1[key] === obj2[key]);

const { printReceived, printExpected } = require("jest-matcher-utils");
const diff = require("jest-diff");
const structjson = require("./structjson");

export function selectFulfillmentMessages(
  result: dialogflow.QueryResult,
  type: string,
  source?: dialogflow.Platform
): dialogflow.Message[] {
  const fulfillmentMessages = result.fulfillmentMessages.filter(
    ({ message, platform }) => message === type && platform === source
  );

  return fulfillmentMessages;
}

export function selectExampleMessage(
  messages: dialogflow.TextMessage[],
  correspondingMessage: dialogflow.TextMessage | undefined
): string | false | undefined {
  if (messages.length === 0) {
    return;
  }

  return !correspondingMessage && messages[0].text.text[0];
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveIntent(intent: string): R;
      toHaveContext(content: dialogflow.Context): R;
      toHaveTextResult(text: string): R;
      toHaveOneOfTextResults(textArray: string[]): R;
      toHaveQuickReplies(quickReplies: string[]): R;
      toHaveCard(expectedCard: dialogflow.Card): R;
    }
  }
}

/**
 * As there are currently no ways to retrieve the platform from the query result
 * we consider a response from Actions On Google if one of the fulfillment messages
 * has a platform whose value is ACTIONS_ON_GOOGLE
 */
export function isActionsOnGoogle(result: dialogflow.QueryResult): Boolean {
  return result.fulfillmentMessages.some(
    message => message.platform === "ACTIONS_ON_GOOGLE"
  );
}
const matchers = {
  toHaveIntent(result: dialogflow.QueryResult, intent: string) {
    const query = result.queryText;
    const matchedIntent = result.intent.displayName;

    return {
      pass: matchedIntent === intent,
      message: () =>
        `Query: "${query}"\nExpected intent: ${printExpected(
          intent
        )}\nReceived intent: ${printReceived(
          matchedIntent
        )}.\n\nYou may want to check your ${
          "training phrases".bold
        }. Make sure they are not ${"conflicting".bold} across your intents.`
    };
  },
  toHaveContext(
    result: dialogflow.QueryResult,
    expectedContext: dialogflow.Context
  ) {
    if (!expectedContext || equals(expectedContext, {})) {
      return {
        pass: false,
        message: () =>
          `You didn't give a context\nRefer to these docs for the format: https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions.contexts#Context.`
      };
    }

    const receivedContext = result.outputContexts.find(context => {
      const contextName = context.name.split("contexts/")[1];
      return expectedContext.name === contextName;
    });

    if (!receivedContext) {
      return {
        pass: false,
        message: () =>
          `No context with name "${
            expectedContext.name.bold
          }" have been found in the output contexts. Make sure you provided one and that its name is ${
            "lowercased".bold
          }.`
      };
    }

    const formattedReceivedContext = {
      name: expectedContext.name,
      lifespanCount: receivedContext.lifespanCount,
      parameters: structjson.structProtoToJson(receivedContext.parameters)
    };

    return {
      pass: Object.is(formattedReceivedContext, expectedContext),
      message: () =>
        `The expected context is not the same as the received one.\n\nDifference:\n${diff(
          formattedReceivedContext,
          expectedContext
        )}`
    };
  },
  toHaveText(result: dialogflow.QueryResult, expectedText: string) {
    const textMessages = selectFulfillmentMessages(
      result,
      "text"
    ) as dialogflow.TextMessage[];

    const correspondingMessage = textMessages.find(
      ({ text: { text } }) => text[0] === expectedText
    );

    const exampleMessage = selectExampleMessage(
      textMessages,
      correspondingMessage
    );

    if (!correspondingMessage) {
      return {
        pass: false,
        message: () =>
          `No such text message have been found in the fulfillment messages.\nMake sure that you're looking for ${
            "text only".bold
          } and not text in cards or custom payloads for example.${
            exampleMessage
              ? "\nHere is one of the text messages displayed:\n\n" +
                colors.blue(`"${exampleMessage}"`)
              : ""
          }`
      };
    }

    return {
      pass: true
    };
  },
  toHaveOneOfTexts(
    result: dialogflow.QueryResult,
    expectedTextArray: String[]
  ) {
    const textMessages = selectFulfillmentMessages(
      result,
      "text"
    ) as dialogflow.TextMessage[];

    const correspondingMessage = textMessages.find(
      ({
        text: {
          text: [text]
        }
      }) => {
        return expectedTextArray.includes(text);
      }
    );

    if (!correspondingMessage) {
      const exampleMessage = selectExampleMessage(
        textMessages,
        correspondingMessage
      );
      return {
        pass: false,
        message: () =>
          `No such text message have been found in the fulfillment messages.\nMake sure that you're looking for ${
            "text only".bold
          } and not text in cards or custom payloads for example.${
            exampleMessage
              ? "\nHere is one of the text messages displayed:\n\n" +
                colors.blue(`"${exampleMessage}"`)
              : ""
          }`
      };
    }

    return {
      pass: true
    };
  },
  toHaveQuickReplies(
    result: dialogflow.QueryResult,
    expectedQuickReplies: String[]
  ) {
    const quickRepliesArray = selectFulfillmentMessages(
      result,
      "quickReplies"
    ) as dialogflow.QuickRepliesMessage[];

    if (quickRepliesArray.length === 0) {
      return {
        pass: false,
        message: () => colors.red("There are no quick replies in the response.")
      };
    }

    const quickReplies = quickRepliesArray[0].quickReplies.quickReplies;

    return {
      pass: Object.is(quickReplies, expectedQuickReplies),
      message: () =>
        `The expected quick replies are different from the received ones:\n\n${diff(
          quickReplies,
          expectedQuickReplies
        )}.\n\nMake sure you provided the quick replies ${colors.bold(
          "in the right order."
        )}`
    };
  },
  toHaveCard(
    result: dialogflow.QueryResult,
    expectedCard: dialogflow.CardMessage
  ) {
    const cardArray = selectFulfillmentMessages(
      result,
      "card"
    ) as dialogflow.CardMessage[];

    if (cardArray.length === 0) {
      return {
        pass: false,
        message: () => colors.red("There are no cards in the response.")
      };
    }

    const card = cardArray[0].card;

    return {
      pass: Object.is(card, expectedCard),
      message: () =>
        `The expected card is different from the received one:\n\n${diff(
          card,
          expectedCard
        )}.`
    };
  }
};

export default matchers;
