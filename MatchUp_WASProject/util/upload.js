const express = require('express');
const multer = require('multer');
const path = require('path');

//파일업로드 multer 설정
exports.single_upload = multer({
    storage: multer.diskStorage({ //storage 속성에는 어디에 어떤 이름으로 저장할지를 설정한다.
      //req 객체에는 요청에 대한 정보, file 객체에는 업로드 파일에 대한 정보가 있음. done은 함수
      destination(req, file, done) {  
        //done의 첫번째 인수에는 에러가 있다면 에러를 넣고, 두번째 인수에는 실제 경로를 넣는다.
        done(null, 'uploads/'); //req와 file의 데이터를 가공하여 done으로 넘긴다.
      },
      filename(req, file, done) {
        const ext = path.extname(file.originalname);
        //done의 첫번째 인수에는 에러가 있다면 에러를 넣고, 두번째 인수에는 저장할 파일명을 넣는다.
        done(null, path.basename(file.originalname, ext) + Date.now() + ext); //파일명 + 현재시간 + 확장자로 중복 방지 이름 설정
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },  //limits 속성에는 파일 사이즈 등 업로드에 대한 제한 사항을 설정한다.
});

exports.none_upload = multer();