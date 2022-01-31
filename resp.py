# no cookie
req_headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
    'upgrade-insecure-requests': '1',
#     'cookie': 'cookielawinfo-checkbox-necessary=yes; _tccl_visitor=265cf2db-1459-4528-b569-0bc951771ab3; cookielawinfo-checkbox-functional=yes; cookielawinfo-checkbox-performance=yes; cookielawinfo-checkbox-analytics=yes; cookielawinfo-checkbox-advertisement=yes; cookielawinfo-checkbox-others=yes; CookieLawInfoConsent=eyJuZWNlc3NhcnkiOnRydWUsImZ1bmN0aW9uYWwiOnRydWUsInBlcmZvcm1hbmNlIjp0cnVlLCJhbmFseXRpY3MiOnRydWUsImFkdmVydGlzZW1lbnQiOnRydWUsIm90aGVycyI6dHJ1ZX0=; viewed_cookie_policy=yes'
}
# jupyter python response headres same as Chromes (except Content-Encoding)
res_headers = { 
    'Transfer-Encoding': 'chunked', 
    'Connection': 'keep-alive', 
    'age': '0', 
    'alt-svc': 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
    'CF-Cache-Status': 'DYNAMIC', 
    'CF-RAY': '6d62f0afd95a7403-LHR', 
    'Content-Encoding': 'gzip', # br
    'content-security-policy': 'upgrade-insecure-requests', 
    'Content-Type': 'text/html; charset=UTF-8', 
    'Date': 'Mon, 31 Jan 2022 12:28:32 GMT', 
    'Expect-CT': 'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
    'NEL': '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}', 
    'Report-To': '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=%2BmcmyZaF5AjRDjUU8ewQLplSgeKfLwhwFHIVI30ve6nWl1L5nGb6PPCsLt0mBmfyWHuPYlRQHFo%2FoVXncSacH7s6sg2OGBWCKUckqmNax5jQ3Ipiyxh7phKoGJQbNkZhZzhQoRBtYX9q"}],"group":"cf-nel","max_age":604800}', 
    'Server': 'cloudflare', 
    'strict-transport-security': 'max-age=300, max-age=31536000; includeSubDomains', 
    'vary': 'Accept-Encoding, User-Agent', 

    'x-backend': 'local', 
    'x-cache': 'uncached', 
    'x-cache-hit': 'MISS', 
    'x-cacheable': 'YES:Forced', 
    'x-content-type-options': 'nosniff', 
    'x-xss-protection': '1; mode=block', 
}
