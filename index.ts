import * as dialogflow from "dialogflow";
import * as uuid from "uuid";

const matchers = require("./src/matchers");
const structjson = require("./src/structjson");

expect.extend(matchers);

function generateSession(
  projectId: string
): [dialogflow.SessionsClient, string] {
  const sessionId = uuid.v4();

  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  return [sessionClient, sessionPath];
}

async function request(
  text: string,
  source: dialogflow.Platform,
  languageCode: string,
  [sessionClient, sessionPath]: [dialogflow.SessionsClient, string]
): Promise<dialogflow.QueryResult> {
  const request: dialogflow.DetectIntentRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode
      }
    },
    queryParams: {
      payload: structjson.jsonToStructProto({
        source
      })
    }
  };

  const responses = await sessionClient.detectIntent(request);

  return responses[0].queryResult;
}

interface Bot {
  request: (text: string) => Promise<dialogflow.QueryResult>;
  newSession: () => Bot;
}

function createBot(
  projectId: string,
  source: dialogflow.Platform,
  languageCode: string = "en"
): Bot {
  const session = generateSession(projectId);

  return {
    request: async function(text: string) {
      const response = await request(text, source, languageCode, session);
      return response;
    },
    newSession: function() {
      return createBot(projectId, source, languageCode);
    }
  };
}

export = createBot;
