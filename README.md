Localstack Demo

_NOTE: If you are using AWS CLI v2, you will need to link the docker containers_

- https://docs.localstack.cloud/integrations/aws-cli/

```
docker network create localstack
```

Then modify the docker-compose.yml specifying the network to use:

```
networks:
  default:
    external:
      name: "localstack"
```

Helpful Medium article:

- https://onexlab-io.medium.com/localstack-sns-to-sqs-47a38f33b8f4
