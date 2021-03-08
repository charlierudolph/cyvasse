Run the following
```
./generte_certificates
docker-compose up -d postgres
```

Then can test various client scenarios
```
# Successful connection
docker-compose run --rm postgres-client psql -h postgres -p 5432 -U test

# Failed connections
docker-compose run --rm postgres-client-invalid-client-cert psql -h postgres -p 5432 -U test
docker-compose run --rm postgres-client-invalid-server-cert psql -h postgres -p 5432 -U test
docker-compose run --rm postgres-client-no-client-certs psql -h postgres -p 5432 -U test
docker-compose run --rm postgres-client-no-ssl psql -h postgres -p 5432 -U test
```