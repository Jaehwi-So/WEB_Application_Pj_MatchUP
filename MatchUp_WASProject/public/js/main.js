//객체 시리얼라이징
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [ o[this.name] ];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

//날짜 포매터
function setDigitFormat(n, digits) {
    let zero = '';
    n = n.toString();
    if (n.length < digits) {
      for (i = 0; i < digits - n.length; i++)
        zero += '0';
    }
    return zero + n;
}
function timeFormat(time) {
    let date = new Date(time);
    const str =
      setDigitFormat(date.getFullYear(), 4) + '-' +
      setDigitFormat(date.getMonth() + 1, 2) + '-' +
      setDigitFormat(date.getDate(), 2) + ' ' +
      setDigitFormat(date.getHours(), 2) + ':' +
      setDigitFormat(date.getMinutes(), 2) + ':' +
      setDigitFormat(date.getSeconds(), 2);
  
    return str;
}