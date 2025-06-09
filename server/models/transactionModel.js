import { Schema, model } from 'mongoose';

const transactionSchema = new Schema({
    plan :{type:String , required: true},
    amount: { type: Number, required: true },
    credits : { type: Number, required: true },
    payement : { type: Boolean, default: false },
    date : {type : Number}
});

const transactionModel = model('transaction', transactionSchema);
export default transactionModel;
