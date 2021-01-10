const DEBUG = false;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const LOG = (...msg: any): void => {
    if (!!DEBUG) {
        console.log(...msg);
    }
};

export class Logger
{
    public log(message : string) : void
    {
        console.log(this.makeNowDateTimeString() + " - " + message)
    }

    public err(message : string) : void
    {
        console.error(this.makeNowDateTimeString() + " - " + message);
    }

    private	makeNowDateTimeString() : string
    {
        var dateTime = new Date();
        return (dateTime.getFullYear().toString() + "-" + (dateTime.getMonth()+1).toString ().padStart(2, '0') + "-" + dateTime.getDate().toString ().padStart(2, '0') + " " + dateTime.getHours().toString ().padStart(2, '0') + ":" + dateTime.getMinutes().toString ().padStart(2, '0') + ":" + dateTime.getSeconds().toString ().padStart(2, '0'));
    }
}
