const e = require("express");

module.exports = class Pager{
    //let page = Pager.getPage(url, curPage, contentSize, pageSize, skipSize, rowTotal);
    //url, 쿼리 유무, 현재 페이지, 페이지 컨텐츠 수, 한 화면 페이지네이션 개수, 생략 컨텐츠 수, 총 로우 개수
    static getPage = (pageURL, isQuery, curPage, contentSize, pageSize, skipSize, rowTotal, isAjax, ajaxF) => {
        try{
        const start = ((Math.ceil(curPage / pageSize) - 1) * pageSize) + 1;   //페이지네이션 시작 번호
        let end = (start + pageSize) - 1;   //페이지네이션 끝 번호
        const total = Math.ceil(rowTotal / contentSize);    //페이지네이션 전체 수
        if (end > total) end = total;

        let isPrev = false;
        let isNext = false;
        if(end < total) isNext = true;
        if(start > 1) isPrev = true;
        //start, end, total, curPage
        let pager = "";
        //그룹페이징 이전으로 가기 처리
        if(isPrev){
            if(isAjax){
                if(isQuery){
                    pager += '<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "&page=" + (start - 1); 
                    pager += "');" + '">' + 'prev' + '</span>'
                } 
                else{
                    pager += '<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "?page=" + (start - 1); 
                    pager += "');" + '">' + 'prev' + '</span>'
                }
            } 
            else{
                if(isQuery) pager += "<a href ='" + pageURL + "&page=";
                else pager += "<a href ='" + pageURL + "?page=";
                pager +=  start -1 ;
                pager += "'>prev</a>";
            }
        }
        else{
            pager += "prev"
        }
        //그룹페이징 처리
        for(let i = start; i <= end; i++){
            if(i > total) break;
            if(i == curPage){ //현재 있는 페이지
                pager += "&nbsp;<b><font color='#f00'>"
                pager += i;
                pager += "</font></b>";
            }
            else{//현재 페이지가 아니면
                if(isAjax){
                    if(isQuery){
                        pager += '&nbsp;<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "&page=" + i; 
                        pager += "');" + '">' + i + '</span>'
                    } 
                    else{
                        pager += '&nbsp;<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "?page=" + i; 
                        pager += "');" + '">' + i + '</span>'
                    }
                } 
                else{
                    if(isQuery) pager += "&nbsp;<a href='" + pageURL+ "&page=";
                    else pager += "&nbsp;<a href='" + pageURL+ "?page=";
                    pager += i;
                    pager += "'>";
                    pager += i;
                    pager += "</a>"
                }
            }
        }
        pager += "&nbsp;";
         //-----그룹페이지처리 다음 ----------------------------------------------------------------------------------------------
        if(isNext){
            if(isAjax){
                if(isQuery){
                    pager += '<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "&page=" + (end + 1); 
                    pager += "');" + '">' + 'next' + '</span>'
                } 
                else{
                    pager += '<span style="cursor:pointer;" onclick="' + ajaxF + "('" + pageURL + "?page=" + (end + 1); 
                    pager += "');" + '">' + 'next' + '</span>'
                }
            } 
            else{
                if(isQuery) pager += "<a href='"+ pageURL +"&page=";
                else pager += "<a href='"+ pageURL +"?page=";
                pager += end + 1;
                pager += "'>next</a>";
            }
        }
        else pager += "next";
        return pager;
    }
    catch(e){
        console.error(e);
    }
    }
};

