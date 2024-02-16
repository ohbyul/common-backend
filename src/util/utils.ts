export default class Utils {
    private static instance: Utils;
   
    //singleton api
    public static getInstance = () => this.instance || (this.instance = new this());

    private constructor() {}
    
    public getRandomNumber = (num:number) => {
        
        const characters ='0123456789';

        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < num; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

}