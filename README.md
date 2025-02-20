# embrace north reservation poller

see .env.example and fill in with embrace north credentials

in index.js, set `DATES` variable to a priority order list of times to look for. once one of these times is booked, the selected time will be logged and the process will exit.

## install deps
```
> yarn
```

if you want to roll the dice and do not have yarn, you could `npm i` instead.

## run
```
> yarn run
```

have fun