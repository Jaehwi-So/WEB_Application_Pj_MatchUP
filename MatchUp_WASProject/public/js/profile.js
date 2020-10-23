
//프로필 사진 저장
const update_photo = (f) => {
    if(f.photo.value.trim() == ''){
        alert("바꿀 프로필 사진을 업로드해주세요");
        return;
    }
    var form = $("#upload_form").serializeObject();
    axios.post('/user/photo', form)
    .then((res) => {
        if(res.data.res == "success"){
            alert("프로필 사진 변경이 완료되었습니다.");
        }
        else{
            alert("프로필 사진 변경에 실패했습니다.");
        }
        location.reload();
    })
    .catch((err) => {
        console.error(err);
    });
};


//사진 업로드시 미리보기 처리
if (document.getElementById('upload_photo')) {
    document.getElementById('upload_photo').addEventListener('change', function(e) {
        const formData = new FormData();
        formData.append('img', this.files[0]);
        axios.post('/user/upload', formData)
        .then((res) => {
            document.getElementById('photo_url').value = res.data.url;
            document.getElementById('prof_photo').src = res.data.url;
        })
        .catch((err) => {
            console.error(err);
        });
    });
};

//팔로우
const follow = (f) => {
    const memberID = document.getElementById('member_id').value;
    const myID = f.my_id.value;
    if (memberID !== myID) {
        if (confirm('팔로우 하시겠습니까?')) {
            axios.post(`/user/follow/${memberID}`)
            .then((res) => {
                if(res.data.res == "success"){
                    alert('팔로우 하였습니다.');
                    location.reload();
                }
                else{
                    alert('팔로우를 실패했습니다.');
                }
            })
            .catch((err) => {
                console.error(err);
            });
        }
    }
    else{
        alert('자신을 팔로우할 수 없습니다.');
        return;
    }
};

//언팔로우
const unfollow = (f) => {
    const memberID = document.getElementById('member_id').value;
    const myID = f.my_id.value;
    if (memberID !== myID) {
        if (confirm('팔로우를 취소하시겠습니까?')) {
            axios.post(`/user/unfollow/${memberID}`)
            .then((res) => {
                if(res.data.res == "success"){
                    alert('팔로우를 취소했습니다.');
                    location.reload();
                }
                else{
                    alert('팔로우 취소를 실패했습니다.');
                }
            })
            .catch((err) => {
                console.error(err);
            });
        }
    }
    else{
        alert('자신을 언팔로우할 수 없습니다.');
        return;
    }
};

//팔로워 목록 보기
function follower_list(f){
    const id = document.getElementById('member_id').value
    location.href = '/user/follower/' + id;
};
//팔로잉 목록 보기
function following_list(f){
    const id = document.getElementById('member_id').value;
    location.href = '/user/following/' + id;
};
//회원정보 수정 시 화면
const update_ck = () => {
    document.getElementById('update_ck_box').style = "display : block";
}
//수정 취소 시 화면
const update_cancel = () => {
    document.getElementById('update_ck_box').style = "display : none";
}
//회원정보 수정
const update_info = () => {
    const pwd = document.getElementById('input_pwd').value;
    axios.post('/auth/update', { user_pwd :  pwd})
    .then((res) => {
        if(res.data.res == "success"){
            location.href = '/update';
         }
        else{
            alert('비밀번호가 일치하지 않습니다.');
        }
    });
}
//회원 탈퇴
const user_del = () => {
    const pwd = document.getElementById('input_pwd').value;
    const ck = confirm('정말로 탈퇴하시겠습니까?');
    if(ck){
        axios.delete('/user', {
        data: {user_pwd :  pwd}
        })
        .then((res) => {
            if(res.data.res == "success"){
                alert('회원 탈퇴가 완료되었습니다.')
                location.href = '/';
            }
            else{
                alert('비밀번호가 일치하지 않습니다.');
            }
        });
    }
    else{
        return;
    }
}