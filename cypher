match (ips:Dispensary where ips.NAME contains 'IPS')
match (dg:Dispensary where dg.NAME contains 'Green')
match (p:Product) 
where exists((p)-[:AT_DISPENSARY]->(ips)) and not exists((p)-[:AT_DISPENSARY]->(dg)) 
 return p.NAME