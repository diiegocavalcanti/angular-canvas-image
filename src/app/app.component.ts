import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as $ from 'jquery';
import { fromEvent, Observable } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-canvas',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  styles: ['canvas { border: 2px solid #000; }']
})
export class AppComponent implements OnInit {
  @ViewChild('canvas') canvas: ElementRef;
  context: CanvasRenderingContext2D;
  image: CanvasRenderingContext2D;

  @Input() public width = 400;
  @Input() public height = 400;

  pointerColor = '#000000';
  cPushArray = [];
  cStep = 1;
  mousePressed = false;

  public canvasFabric;

  imagem: any = '';
  imageToShow: any;
  result: any;

  original: any;
  url: any;
  color;
  previousSibling;
  value;
  originalFile;

  constructor(private http: HttpClient, private satanas: DomSanitizer) { }

  public ngOnInit() {
    // this.canvas = new fabric.Canvas('canvas-fabric', {
    //   isDrawingMode: true,
    //   selection: true,
    //   freeDrawingBrush: 'square'
    // });

    $('#canvas').on('mouseup', (event) => {

      if (this.cPushArray.length === 0) {
        this.cPushArray.push(this.originalFile);
      }

      const canvas = event.target as HTMLCanvasElement;
      const dataURL = canvas.toDataURL();

      this.cPushArray.push(dataURL);

      console.log(this.cPushArray);
    });


    this.getImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTz4LYX0701zvt_1PuQPnfgAM97G8MbPLO678eZ2A7Uzsaw_5urHA&s')
      .subscribe(imageUrl => {
        this.loadImage(URL.createObjectURL(imageUrl));
        this.getBase64Image(URL.createObjectURL(imageUrl));
      });
  }

  getBase64Image(imgUrl: string): Promise<string> {
    return new Promise<string>(resolve => {
      const img = new Image();
      img.src = imgUrl;
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        console.log(img.width);
        console.log(img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');

        if (this.cPushArray.length === 0) {
          this.originalFile = dataURL;
        }
        resolve(dataURL.replace(/^data:image\/(png|jpg);base64,/, ''));
      });
    });
  }

  getImage(imagem: any): Observable<Blob> {
    const httpOptions = {
      responseType: 'blob' as any
    };
    return this.http.get<Blob>(imagem, httpOptions);
  }

  cPush() {
    this.cStep++;
    if (this.cStep < this.cPushArray.length) { this.cPushArray.length = this.cStep; }
    this.cPushArray.push(document.getElementById('canvas'));
    document.title = this.cStep + ':' + this.cPushArray.length;
  }

  loadImage(imageUrl: any): void {

    const image = new Image();
    const imgObjURL = this.satanas.bypassSecurityTrustResourceUrl(imageUrl) as any;
    this.context = (this.canvas.nativeElement as HTMLCanvasElement).getContext('2d');
    image.src = imgObjURL.changingThisBreaksApplicationSecurity;

    image.onload = () => {
      this.context.drawImage(image, 0, 0, this.width, this.height);
    };
    this.image = this.context;
    this.changePointerColor();

    this.captureEvents(this.canvas.nativeElement);
  }

  changePointerColor(): void {
    this.context.strokeStyle = this.pointerColor;
    this.context.lineWidth = 4;
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {

    fromEvent(canvasEl, 'mousedown')
      .pipe(switchMap(() => {
        return fromEvent(canvasEl, 'mousemove')
          .pipe(
            takeUntil(fromEvent(canvasEl, 'mouseup')),
            takeUntil(fromEvent(canvasEl, 'mouseleave')),
            pairwise()
          );
      }))
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();
        const prevPos = { x: res[0].clientX - rect.left, y: res[0].clientY - rect.top };
        const currentPos = { x: res[1].clientX - rect.left, y: res[1].clientY - rect.top };
        this._drawOnCanvas(prevPos, currentPos);
      });
  }

  private _drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.context) { return; }

    this.context.beginPath();

    if (prevPos) {
      this.context.moveTo(prevPos.x, prevPos.y);
      this.context.lineTo(currentPos.x, currentPos.y);
      this.context.fill();
      this.context.stroke();
      // this.cPushArray.push(this.context);
    }
  }

  limpar(): void {
    this.loadImage(this.cPushArray[0]);
    this.cPushArray = [];

  }

  save(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const dataURL = canvas.toDataURL();
    this.imageToShow = dataURL;
  }

  cUndo() {
    const canvasPic = new Image();
    const last = this.cPushArray.pop();
    const pos = (this.cPushArray.length - 1);
    canvasPic.src = this.cPushArray[pos];
    this.loadImage(canvasPic.src);
    // this.imagem = this.context;
  }

  onSelectFile(event) {
    this.height = 400;
    this.width = 400;
    console.log(event);
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.onload = (evt: any) => { // called once readAsDataURL is completed
        const image = new Image();
        image.onload = (e) => {
          if (image.width > image.height) {
            if (image.width > this.width) {
              const prop = (image.height * 100) / image.width;
              this.height = (this.width * prop) / 100;
            }
          } else if (image.height > image.width) {
            const prop = (image.width * 100) / image.height;
            this.width = (this.height * prop) / 100;

          } else if (image.width === image.height) {
            this.height = this.width;
          }
        };
        image.src = evt.target.result;
        this.loadImage(evt.target.result);
      };
      reader.readAsDataURL(event.target.files[0]);

    }

  }


  resizeImg(w, h) {
    if (w > h) {
      if (w > this.width) {
        w = this.width;
        const prop = (h * 100) / w;
        h = (w * prop) / 100;
      }
    }
  }
}






