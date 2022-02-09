import fs from "fs";
import fetch from "node-fetch";

async function getDg() {
  const dg = await fetch(
    "https://thecannabispages.co.uk/wp-admin/admin-ajax.php?action=wp_ajax_ninja_tables_public_action&table_id=4459&target_action=get-all-data&default_sorting=old_first&ninja_table_public_nonce=4f5bced4c3",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7",
        "sec-ch-ua":
          '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-requested-with": "XMLHttpRequest",
        cookie:
          "cookielawinfo-checkbox-necessary=yes; _tccl_visitor=265cf2db-1459-4528-b569-0bc951771ab3; cookielawinfo-checkbox-functional=yes; cookielawinfo-checkbox-performance=yes; cookielawinfo-checkbox-analytics=yes; cookielawinfo-checkbox-advertisement=yes; cookielawinfo-checkbox-others=yes; CookieLawInfoConsent=eyJuZWNlc3NhcnkiOnRydWUsImZ1bmN0aW9uYWwiOnRydWUsInBlcmZvcm1hbmNlIjp0cnVlLCJhbmFseXRpY3MiOnRydWUsImFkdmVydGlzZW1lbnQiOnRydWUsIm90aGVycyI6dHJ1ZX0=; viewed_cookie_policy=yes; _tccl_visit=265d0a3f-8980-465c-9648-0d9a380960e5",
        Referer: "https://thecannabispages.co.uk/cbmps-stock-checker/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const data = await dg.json();
  return data;
}

async function getIpc() {
  const Ipc = await fetch(
    "https://thecannabispages.co.uk/wp-admin/admin-ajax.php?action=wp_ajax_ninja_tables_public_action&table_id=4457&target_action=get-all-data&default_sorting=old_first&ninja_table_public_nonce=4f5bced4c3",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7",
        "sec-ch-ua":
          '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-requested-with": "XMLHttpRequest",
        cookie:
          "cookielawinfo-checkbox-necessary=yes; _tccl_visitor=265cf2db-1459-4528-b569-0bc951771ab3; cookielawinfo-checkbox-functional=yes; cookielawinfo-checkbox-performance=yes; cookielawinfo-checkbox-analytics=yes; cookielawinfo-checkbox-advertisement=yes; cookielawinfo-checkbox-others=yes; CookieLawInfoConsent=eyJuZWNlc3NhcnkiOnRydWUsImZ1bmN0aW9uYWwiOnRydWUsInBlcmZvcm1hbmNlIjp0cnVlLCJhbmFseXRpY3MiOnRydWUsImFkdmVydGlzZW1lbnQiOnRydWUsIm90aGVycyI6dHJ1ZX0=; viewed_cookie_policy=yes; _tccl_visit=265d0a3f-8980-465c-9648-0d9a380960e5",
        Referer: "https://thecannabispages.co.uk/cbmps-stock-checker/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const data = await Ipc.json();
  return data;
}

// getDg().then((json) => {
//   fs.writeFileSync("./datasets/dg.json", JSON.stringify(json));
// });
getIpc().then((json) => {
  fs.writeFileSync("./datasets/ipc.json", JSON.stringify(json));
});
