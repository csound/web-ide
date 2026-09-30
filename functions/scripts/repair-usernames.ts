import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Firestore } from "@google-cloud/firestore";
import { ensureProfileUsername, hasUsername } from "../src/profile_username.js";

const args = process.argv.slice(2);
const option = (name: string) => args[args.indexOf(name) + 1];
if (!args.includes("--project") || !args.includes("--report")) {
    throw new Error(
        "Usage: tsx scripts/repair-usernames.ts --project ID --report PATH [--apply] [--firebase-login]"
    );
}
const projectId = option("--project");
const apply = args.includes("--apply");
let credentials;
if (args.includes("--firebase-login")) {
    const require = createRequire(import.meta.url);
    const auth = require("firebase-tools/lib/auth.js");
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw new Error("Run firebase login first");
    const api = require("firebase-tools/lib/api.js");
    credentials = {
        type: "authorized_user",
        client_id: api.clientId(),
        client_secret: api.clientSecret(),
        refresh_token: account.tokens.refresh_token
    };
}
const database = new Firestore({
    projectId,
    ...(credentials ? { credentials } : {})
});
const [profiles, names] = await Promise.all([
    database.collection("profiles").select("username").get(),
    database.collection("usernames").select("userUid").get()
]);
const owners = new Map(
    names.docs.map((name) => [name.id, name.data().userUid])
);
const issues = profiles.docs.flatMap((profile) => {
    const username = profile.data().username;
    if (hasUsername(username) && owners.get(username) === profile.id) return [];
    const aliases = names.docs
        .filter((name) => name.data().userUid === profile.id)
        .map((name) => name.id);
    return [{ uid: profile.id, previousUsername: username ?? null, aliases }];
});
const report = {
    projectId,
    apply,
    profiles: profiles.size,
    issues,
    results: [] as unknown[],
    errors: [] as { uid: string; message: string }[]
};
const saveReport = () =>
    writeFileSync(option("--report"), JSON.stringify(report, null, 2), {
        mode: 0o600
    });
saveReport();
console.log(
    JSON.stringify({
        projectId,
        apply,
        profiles: profiles.size,
        affected: issues.length
    })
);
if (apply) {
    // Keep requests bounded while each account uses its own transaction.
    for (let offset = 0; offset < issues.length; offset += 8) {
        await Promise.all(
            issues.slice(offset, offset + 8).map(async (issue) => {
                try {
                    report.results.push(
                        await ensureProfileUsername(database, issue.uid)
                    );
                } catch (error) {
                    report.errors.push({
                        uid: issue.uid,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Repair failed"
                    });
                }
                saveReport();
            })
        );
        if ((offset + 8) % 100 === 0) {
            console.log(
                JSON.stringify({
                    repaired: report.results.length,
                    errors: report.errors.length
                })
            );
        }
    }
    console.log(
        JSON.stringify({
            repaired: report.results.length,
            errors: report.errors.length
        })
    );
    if (report.errors.length) process.exitCode = 1;
}
