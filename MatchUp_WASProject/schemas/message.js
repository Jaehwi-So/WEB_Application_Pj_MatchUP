const mongoose = require('mongoose');

const { Schema } = mongoose;
const messageSchema = new Schema({
    /*title	-- 쪽지 제목
    content	-- 쪽지 컨텐츠
    type	-- 쪽지 타입
    sender_id	-- 쪽지 발신인
    sender_nick	-- 쪽지 발신인 닉네임
    receiver_id	-- 쪽지 수신인
    receiver_nick	-- 쪽지 수신인 닉네임
    url	-- 타입에 따른 url*/

    //_id
    title: {
        type: String,
        required: true,
        unique: false
    },
    content: {
        type: String,
        required: true,
        unique: false
    },
    type: {
        type: String,
        required: true,
        unique: false
    },
    sender_id: {
        type: Number,
        required: true,
        unique: false
    },
    sender_nick: {
        type: String,
        required: true,
        unique: false
    },
    receiver_id: {
        type: Number,
        required: true,
        unique: false
    },
    receiver_nick: {
        type: String,
        required: true,
        unique: false
    },
    isRead : {
        type: Boolean,
        default: false
    },
    additional_info: {
        type: String,
        required: false,
        unique: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }   
});
//몽구스 스키마의 자료형 
//String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array

module.exports = mongoose.model('Message', messageSchema);
