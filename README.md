# embrace north reservation poller

## setup
```
> yarn
> cp .env.example .env
```

fill in .env with your embrace north credentials.

if you want to roll the dice and do not have yarn, you could `npm i` instead.

in index.js, set `DATES` variable to a priority order list of times to look for. once one of these times is booked, the selected time will be logged and the process will exit.

## run
```
> yarn run
```

have fun