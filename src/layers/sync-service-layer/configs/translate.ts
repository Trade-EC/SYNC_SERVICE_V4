import {
  TranslateClient,
  TranslateTextCommand
} from "@aws-sdk/client-translate";

const translateClient = new TranslateClient({
  region: process.env.REGION ?? " "
});

const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: sourceLang,
    TargetLanguageCode: targetLang
  });
  const response = await translateClient.send(command);
  return response.TranslatedText || "";
};

export default translateText;
