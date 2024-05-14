export class DateEx extends Date{
  toFormatString(){
    const year = this.getFullYear();
    const month = (this.getMonth() + 1).toString().padStart(2, '0');
    const day = this.getDate().toString().padStart(2, '0');
    const hour = this.getHours().toString().padStart(2, '0');
    const minute = this.getMinutes().toString().padStart(2, '0');
    const second = this.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
}
