#!/bin/sh
set -ex

rm -f *.key *.crt *.csr *.srl


openssl genrsa -out root.key 4096
chmod 0600 root.key
openssl req -x509 -new -nodes -key root.key -sha256 -out root.crt -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=root"

openssl genrsa -out client.key 4096
chmod 0600 client.key
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=client"
openssl x509 -req -in client.csr -CA root.crt -CAkey root.key -CAcreateserial -out client.crt -sha256

openssl genrsa -out server.key 4096
chmod 0600 server.key
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=server"
openssl x509 -req -in server.csr -CA root.crt -CAkey root.key -CAcreateserial -out server.crt -sha256

openssl genrsa -out bad-root.key 4096
chmod 0600 bad-root.key
openssl req -x509 -new -nodes -key bad-root.key -sha256 -out bad-root.crt -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=bad-root"

openssl genrsa -out bad-client.key 4096
chmod 0600 bad-client.key
openssl req -new -key bad-client.key -out bad-client.csr -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=bad-client"
openssl x509 -req -in bad-client.csr -CA bad-root.crt -CAkey bad-root.key -CAcreateserial -out bad-client.crt -sha256
