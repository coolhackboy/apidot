import type { LandingJsonValue, LandingPage } from "@/types/pages/landing";

type EndpointDoc = NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];

export type ApiExampleLanguage =
  | "curl"
  | "python"
  | "javascript"
  | "php"
  | "go"
  | "java"
  | "ruby";

export type ApiExampleSamples = {
  curl: string;
  python: string;
  javascript: string;
  php: string;
  go: string;
  java: string;
  ruby: string;
};

export const API_EXAMPLE_LANGUAGES: { value: ApiExampleLanguage; label: string }[] = [
  { value: "curl", label: "cURL" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "php", label: "PHP" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "ruby", label: "Ruby" },
];

type ExampleVariant = NonNullable<EndpointDoc["exampleVariants"]>[number];
type LegacySample = Partial<ApiExampleSamples> & { node?: string };

const clonePayload = (value: EndpointDoc["payloadTemplate"]) => {
  if (!value) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as NonNullable<EndpointDoc["payloadTemplate"]>;
};

export const resolveApiExampleEndpoint = (endpoint: EndpointDoc) => endpoint.endpoint || endpoint.path;

const EDIT_IMAGE_PLACEHOLDER = "https://your-domain.com/source-image.png";
const APIDOT_BASE_URL = "https://api.apidot.ai";

export const resolveApiExampleLanguage = (lang?: string | string[]): ApiExampleLanguage => {
  const value = typeof lang === "string" ? lang : Array.isArray(lang) ? lang[0] : undefined;

  switch (value) {
    case "python":
    case "javascript":
    case "php":
    case "go":
    case "java":
    case "ruby":
    case "curl":
      return value;
    case "node":
      return "javascript";
    default:
      return "curl";
  }
};

const indentBlock = (value: string, indent: string) => value.split("\n").map((line) => `${indent}${line}`).join("\n");

const buildGeneratedSamples = (endpointPath: string, payload: NonNullable<EndpointDoc["payloadTemplate"]>): ApiExampleSamples => {
  const url = `${APIDOT_BASE_URL}${endpointPath}`;
  const payloadJson = JSON.stringify(payload, null, 2);
  const payloadJs = indentBlock(payloadJson, "  ");
  const payloadPy = indentBlock(payloadJson, "    ");
  const payloadPhp = indentBlock(payloadJson, "  ");
  const payloadGo = indentBlock(payloadJson, "      ");
  const payloadJava = indentBlock(payloadJson, "          ");
  const payloadRuby = indentBlock(payloadJson, "  ");

  return {
    curl: `curl --request POST \\
  --url ${url} \\
  --header 'Authorization: Bearer <APIDOT_API_KEY>' \\
  --header 'Content-Type: application/json' \\
  --data '
${payloadJson}
'`,
    python: `import requests

url = "${url}"
payload = ${payloadPy}

response = requests.post(
    url,
    headers={
        "Authorization": "Bearer <APIDOT_API_KEY>",
        "Content-Type": "application/json",
    },
    json=payload,
)

print(response.json())`,
    javascript: `const url = "${url}";
const payload = ${payloadJs};

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": "Bearer <APIDOT_API_KEY>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log(result);`,
    php: `<?php

$url = '${url}';
$payload = <<<'JSON'
${payloadPhp}
JSON;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer <APIDOT_API_KEY>',
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`,
    go: `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    payload := []byte(\`${payloadGo}
\`)

    req, err := http.NewRequest(http.MethodPost, "${url}", bytes.NewBuffer(payload))
    if err != nil {
        panic(err)
    }

    req.Header.Set("Authorization", "Bearer <APIDOT_API_KEY>")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }

    fmt.Println(string(body))
}`,
    java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class APIDotExample {
    public static void main(String[] args) throws Exception {
        String payload = """
${payloadJava}
""";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .header("Authorization", "Bearer <APIDOT_API_KEY>")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(response.body());
    }
}`,
    ruby: `require "net/http"
require "uri"

uri = URI("${url}")
payload = <<~JSON
${payloadRuby}
JSON

request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer <APIDOT_API_KEY>"
request["Content-Type"] = "application/json"
request.body = payload

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts response.body`,
  };
};

const normalizeLegacySamples = (
  sample: LegacySample | undefined,
  generated?: ApiExampleSamples,
): ApiExampleSamples | undefined => {
  if (!sample && !generated) {
    return undefined;
  }

  return {
    curl: sample?.curl || generated?.curl || "",
    python: sample?.python || generated?.python || "",
    javascript: sample?.javascript || sample?.node || generated?.javascript || "",
    php: sample?.php || generated?.php || "",
    go: sample?.go || generated?.go || "",
    java: sample?.java || generated?.java || "",
    ruby: sample?.ruby || generated?.ruby || "",
  };
};

const getExampleVariant = (endpoint: EndpointDoc, selectedModel?: string): ExampleVariant | undefined => {
  if (!endpoint.exampleVariants?.length) {
    return undefined;
  }

  return (
    endpoint.exampleVariants.find((variant) => variant.id === selectedModel) ||
    endpoint.exampleVariants[0]
  );
};

const applySelectedModelPayload = (
  payload: NonNullable<EndpointDoc["payloadTemplate"]>,
  selectedModel?: string,
) => {
  if (!selectedModel) {
    return payload;
  }

  payload.model = selectedModel;

  if (payload.input && typeof payload.input === "object" && !Array.isArray(payload.input)) {
    const input = payload.input as Record<string, LandingJsonValue>;

    if (selectedModel === "gpt-image-2-edit") {
      input.image_urls = [EDIT_IMAGE_PLACEHOLDER];
    }

    if (selectedModel === "gpt-image-2" && "image_urls" in input) {
      delete input.image_urls;
    }
  }

  return payload;
};

export const buildApiExampleSamples = (
  endpoint: EndpointDoc,
  selectedModel?: string,
): ApiExampleSamples => {
  const resolvedEndpoint = resolveApiExampleEndpoint(endpoint);
  const variant = getExampleVariant(endpoint, selectedModel);
  const template = variant?.payloadTemplate || endpoint.payloadTemplate;
  const payload = clonePayload(template);

  if (payload && !variant) {
    applySelectedModelPayload(payload, selectedModel);
  }

  const generated = payload ? buildGeneratedSamples(resolvedEndpoint, payload) : undefined;
  const variantSamples = normalizeLegacySamples(variant?.sample as LegacySample | undefined, generated);

  if (variantSamples) {
    return variantSamples;
  }

  return normalizeLegacySamples(endpoint.sample as LegacySample | undefined, generated) || {
    curl: "",
    python: "",
    javascript: "",
    php: "",
    go: "",
    java: "",
    ruby: "",
  };
};
