### Install dependencies:
```bash
$ yarn
```

### Run:
```bash
$ yarn dev
```

### Install MongoDB with Docker
```bash
$ docker pull mongo
```

### Start a MongoDB instance
```bash
$ docker run --name some-mongo -p 27017:27017 -d mongo[:tag]
```
The MongoDB server starts listening at port **27017**. You can use **localhost**
to connect to it (Linux. Other system would need the IP address of the VM in
which Docker is running).
