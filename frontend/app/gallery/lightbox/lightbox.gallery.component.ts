///<reference path="../../../browser.d.ts"/>

import {Component, ElementRef, ViewChild, QueryList} from "@angular/core";
import {Photo} from "../../../../common/entities/Photo";
import {GalleryPhotoComponent} from "../grid/photo/photo.grid.gallery.component.ts";
import {AnimationBuilder} from "@angular/platform-browser/src/animate/animation_builder";
import {BrowserDomAdapter} from "@angular/platform-browser/src/browser_common";
import {Dimension} from "../../model/IRenderable";

@Component({
    selector: 'gallery-lightbox',
    styleUrls: ['app/gallery/lightbox/lightbox.gallery.component.css'],
    templateUrl: 'app/gallery/lightbox/lightbox.gallery.component.html'
})
export class GalleryLightboxComponent {

    @ViewChild('lightbox') lightBoxDiv:ElementRef;
    @ViewChild('blackCanvas') blackCanvasDiv:ElementRef;
    @ViewChild('imgContainer') imgContainer:ElementRef;


    public imageSize = {width: "auto", height: "100"};
    private activePhoto:GalleryPhotoComponent = null;
    public gridPhotoQL:QueryList<GalleryPhotoComponent>;

    private dom:BrowserDomAdapter;


    constructor(private animBuilder:AnimationBuilder) {
        this.dom = new BrowserDomAdapter();


    }

    public nextImage() {

        let pcList = this.gridPhotoQL.toArray();
        for (let i = 0; i < pcList.length; i++) {
            if (pcList[i] === this.activePhoto && i + 1 < pcList.length) {
                this.activePhoto = pcList[i + 1];

                let toImage = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.photo).toStyle();

                this.forceAnimateFrom(toImage,
                    {},
                    this.imgContainer.nativeElement);


                this.setImageSize();
                return;
            }
        }
    }

    public prevImage() {
        let pcList = this.gridPhotoQL.toArray();
        for (let i = 0; i < pcList.length; i++) {
            if (pcList[i] === this.activePhoto && i > 0) {
                this.activePhoto = pcList[i - 1];

                let toImage = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.photo).toStyle();

                this.forceAnimateFrom(toImage,
                    {},
                    this.imgContainer.nativeElement);

                this.setImageSize();
                return;
            }
        }
    }

    private setImageSize() {
        if (this.activePhoto.gridPhoto.photo.metadata.size.height > this.activePhoto.gridPhoto.photo.metadata.size.width) {
            this.imageSize.height = "100";
            this.imageSize.width = null;
        } else {
            this.imageSize.height = null;
            this.imageSize.width = "100";
        }
    }

    public show(photo:Photo) {
        let selectedPhoto = this.findPhotoComponenet(photo);
        if (selectedPhoto === null) {
            throw new Error("Can't find Photo");
        }

        this.dom.setStyle(this.dom.query('body'), 'overflow', 'hidden');
        this.activePhoto = selectedPhoto;
        this.setImageSize();


        let from = this.activePhoto.getDimension();
        from.top -= this.getBodyScrollTop();


        let fromImage = {width: from.width + "px", height: from.height + "px", top: "0px", left: "0px"};
        let toImage = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.photo).toStyle();

        this.forceAnimateFrom(fromImage,
            toImage,
            this.imgContainer.nativeElement);

        this.forceAnimateFrom(from.toStyle(),
            {height: "100%", width: "100%", "top": "0px", "left": "0px"},
            this.lightBoxDiv.nativeElement);


        this.forceAnimateFrom({opacity: "0", display: "block"},
            {opacity: "1"},
            this.blackCanvasDiv.nativeElement);

    }

    public hide() {
        console.log("hiding");
        let to = this.activePhoto.getDimension();
        to.top -= this.getBodyScrollTop();


        this.forceAnimateTo({height: "100%", width: "100%", "top": "0px", "left": "0px"},
            to.toStyle(),
            this.lightBoxDiv.nativeElement,
            {height: "0px", width: "0px", "top": "0px", "left": "0px"},
            ()=> {
                this.activePhoto = null;
            });

        this.dom.setStyle(this.dom.query('body'), 'overflow', 'auto');

        this.forceAnimateTo({opacity: "1.0", display: "block"},
            {opacity: "0.0", display: "block"},
            this.blackCanvasDiv.nativeElement,
            {display: "none"});


        let fromImage = this.calcLightBoxPhotoDimension(this.activePhoto.gridPhoto.photo).toStyle();
        let toImage = {width: to.width + "px", height: to.height + "px", top: "0px", left: "0px"};

        this.forceAnimateTo(fromImage,
            toImage,
            this.imgContainer.nativeElement);
       

    }

    private findPhotoComponenet(photo) {
        let galleryPhotoComponents = this.gridPhotoQL.toArray();
        let selectedPhoto:GalleryPhotoComponent = null;
        for (let i = 0; i < galleryPhotoComponents.length; i++) {
            if (galleryPhotoComponents[i].gridPhoto.photo == photo) {
                selectedPhoto = galleryPhotoComponents[i];
                break;
            }
        }
        return selectedPhoto;
    }

    private forceAnimateFrom(from, to, elemnet) {
        let anim0 = this.animBuilder.css();
        anim0.setDuration(0);
        anim0.setToStyles(from);
        anim0.start(elemnet).onComplete(()=> {

            let anim1 = this.animBuilder.css();
            anim1.setDuration(500);
            anim1.setFromStyles(from);
            anim1.setToStyles(to);
            anim1.start(elemnet);
        });
    }

    private forceAnimateTo(from, to, elemnet, innerTo = null, onComplete = ()=> {
    }) {
        if (innerTo == null) {
            innerTo = to;
        }

        let anim0 = this.animBuilder.css();
        anim0.setDuration(500);
        anim0.setFromStyles(from);
        anim0.setToStyles(to);
        anim0.start(elemnet).onComplete(()=> {
            let anim1 = this.animBuilder.css();
            anim1.setDuration(0);
            anim1.setToStyles(innerTo);
            anim1.start(elemnet).onComplete(onComplete);
        });
    }

    getPhotoPath() {
        if (!this.activePhoto) {
            return "";
        }
        return this.activePhoto.gridPhoto.getPhotoPath();
    }

    getThumbnailPath() {
        if (!this.activePhoto) {
            return "";
        }
        return this.activePhoto.gridPhoto.getThumbnailPath();
    }

    private getBodyScrollTop() {
        return this.dom.getProperty(this.dom.query('body'), 'scrollTop');
    }

    private getScreenWidth() {
        return window.innerWidth;
    }

    private getScreenHeight() {
        return window.innerHeight;
    }


    private calcLightBoxPhotoDimension(photo:Photo):Dimension {
        let width = 0;
        let height = 0;
        if (photo.metadata.size.height > photo.metadata.size.width) {
            width = Math.round(photo.metadata.size.width * (this.getScreenHeight() / photo.metadata.size.height));
            height = this.getScreenHeight();
        } else {
            width = this.getScreenWidth();
            height = Math.round(photo.metadata.size.height * (this.getScreenWidth() / photo.metadata.size.width));
        }
        let top = (this.getScreenHeight() / 2 - height / 2);
        let left = (this.getScreenWidth() / 2 - width / 2);

        return new Dimension(top, left, width, height);
    }
}

