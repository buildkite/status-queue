# proxy

## Deploying

```
$ docker build -t buildkite-status-queue .
$ docker run --rm --init --interactive --tty --env API_URL --env API_KEY --env GITHUB_URL --env GITHUB_ACCESS_TOKEN buildkite-status-queue
```
