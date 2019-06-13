import * as dialogflow from "dialogflow";
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveIntent(intent: string): R;
      toHaveContext(content: dialogflow.Context): R;
      toHaveText(text: string): R;
      toHaveOneOfTexts(expectedTextArray: String[]): R;
      toHaveOneOfTextResults(textArray: string[]): R;
      toHaveQuickReplies(quickReplies: string[]): R;
      toHaveCard(expectedCard: dialogflow.Card): R;
    }
  }
}
interface Bot {
  request: (text: string) => Promise<dialogflow.QueryResult>;
  newSession: () => Bot;
}
export default function createBot(
  projectId: string,
  source: dialogflow.Platform,
  languageCode?: string
): Bot;
export {};
