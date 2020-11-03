const express = require('express');
const { User, Team, Match } = require('../models');
const Message = require('../schemas/message');
const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

exports.auth_check = async(req, res, next) => {
    try{
        const room = await Room.findOne({ 
            _id : req.params.id,
        });
        if(req.query.type == 'match'){
            const match_id = room.type_id
            const match_root = await Match.findOne({
                where: {id : match_id},
                include: [{
                    model: Team,
                    as: 'Rootteam',
                    include: [{
                        model: User,
                        as: 'Users',
                        where: {id: req.user.id}
                    }],
                }]   
            });
            const match_op = await Match.findOne({
                where: {id : match_id},
                include: [{  
                    model: Team,
                    as: 'Opteam',
                    include: [{
                        model: User,
                        as: 'Users',
                        where: {id: req.user.id}
                    }],
                }]   
            });
            if(!match_root.Rootteam && !match_op.Opteam){
                console.log('no auth this user');
                res.redirect(`/`);
            }
            else{
                next();
            }
        }
        else if(req.query.type == 'team'){
            const team_id = room.type_id
            const team = await Team.findOne({
                where: {id : team_id},
                include: [{
                    model: User,
                    as: 'Users',
                    where: {id: req.user.id}
                }],
            });
            
            if(!team.Users){
                console.log('no auth this user');
                res.redirect(`/`);
            }
            else{
                next();
            }
        }
        else{
            console.log('잘못된 요청');
            res.redirect(`/`);
        }
    }
    catch (error) {
        console.error(error);
        res.redirect(`/`);
    }
}
exports.join_room = async (req, res, next) => {
    try {
      const room = await Room.findOne({ 
          _id : req.params.id,
      });
      const chats = await Chat.find({ room: room._id }).sort('createdAt');
      return res.render('chat/chat_room', {
        room,
        title: room.title,
        chats,
        user_id: req.user.id,
      });
    } catch (error) {
      console.error(error);
      res.redirect(`/`);
    }
};

exports.insert_chat = async (req, res, next) => {
    try {
        const chat = await Chat.create({
            room: req.params.id,
            user: req.user.id,
            user_nick: req.user.nick,
            user_photo : req.user.photo,
            chat: req.body.chat,
        });
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
    }
};
