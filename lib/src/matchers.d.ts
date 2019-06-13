import * as dialogflow from "dialogflow";
export declare function selectFulfillmentMessages(result: dialogflow.QueryResult, type: string, source?: dialogflow.Platform): dialogflow.Message[];
export declare function selectExampleMessage(messages: dialogflow.TextMessage[], correspondingMessage: dialogflow.TextMessage): string | undefined;
/**
 * As there are currently no ways to retrieve the platform from the query result
 * we consider a response from Actions On Google if one of the fulfillment messages
 * has a platform whose value is ACTIONS_ON_GOOGLE
 */
export declare function isActionsOnGoogle(result: dialogflow.QueryResult): Boolean;
