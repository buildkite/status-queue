# proxy

## Deploying

```
$ docker build -t status-queue-worker .
$ docker run --rm --env API_URL --env API_KEY --env GITHUB_URL --env GITHUB_ACCESS_TOKEN status-queue-worker
```
