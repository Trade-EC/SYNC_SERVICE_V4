export interface Image {
  bucket: string;
  key: string;
  name: string;
  url: string;
  category: string;
  externalUrl: string;
  status: "DONE" | "ERROR" | "PROCESSING";
}
