import fs from "node:fs/promises";

const baseUrl = process.env.EVAL_BASE_URL || "http://localhost:3000";
const cases = JSON.parse(await fs.readFile(new URL("./cases.json", import.meta.url), "utf8"));

let passed = 0;
const failures = [];

function samePrice(actual, expected) {
  if (expected === undefined) return true;
  return Number(actual) === Number(expected);
}

for (const testCase of cases) {
  const response = await fetch(`${baseUrl}/api/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-id": "eval",
      "x-session-id": "eval",
    },
    body: JSON.stringify({ text: testCase.input }),
  });
  const result = await response.json();

  const okMatches = Boolean(result.ok) === testCase.ok;
  const priceMatches = !testCase.ok || samePrice(result.price, testCase.price);
  const currencyMatches = !testCase.ok || result.currency === testCase.currency;
  const nameMatches =
    !testCase.ok ||
    String(result.productName || "")
      .toLowerCase()
      .includes(String(testCase.productNameIncludes).toLowerCase());
  const reasonMatches =
    !testCase.reasonIncludes ||
    String(result.reason || "")
      .toLowerCase()
      .includes(String(testCase.reasonIncludes).toLowerCase());
  const reasonCodeMatches =
    !testCase.reasonCode || result.reasonCode === testCase.reasonCode;

  const casePassed =
    okMatches &&
    priceMatches &&
    currencyMatches &&
    nameMatches &&
    reasonMatches &&
    reasonCodeMatches;
  if (casePassed) {
    passed += 1;
  } else {
    failures.push({ input: testCase.input, expected: testCase, actual: result });
  }

  console.log(
    `${casePassed ? "PASS" : "FAIL"} ${testCase.input} -> ${JSON.stringify(result)}`
  );
}

console.log(`\nAI extraction eval: ${passed}/${cases.length} passed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) {
    console.log(JSON.stringify(failure, null, 2));
  }
}
process.exit(passed === cases.length ? 0 : 1);
