import * as THREE from "three";
import { stackHelperFactory, VolumeLoader } from "ami.js";
import { createRingCircle } from "./loadModules";
import { convertScreenPosto3DPos } from "./utils";

/**
 * @module ImageLoader
 */

/**
 * This class is for loading dicom images with using ami.js.
 * @example
 * const container = document.querySelector("#container_root");
 * const allScenes = new ABIThree.Scenes(container, 3);
 * const scene3 = allScenes.getScene(2);
 * const imageLoader = new ABIThree.ImageLoader(
        "Image",
        dicom_file_paths,
        scene3.scene,
        scene3.camera,
        scene3.elem,
        gui,
        callback,
      );
 * imageLoader.viewImage();
 */

class ImageLoader {
  constructor(
    label,
    dicom_file_paths,
    sceneInfo,
    gui,
    screenPosCallbackFunction
  ) {
    /**
     * the image label
     * @type {string}
     */
    this.label = label;

    /**
     * The dicom image paths
     * @type {Array<string>}
     */
    this.path = dicom_file_paths;
    /**
     * Current domElemet scene
     * @type {object}
     */
    this.scene = sceneInfo.scene;
    /**
     * Current scene camera
     * @type {object}
     */
    this.camera = sceneInfo.camera;
    /**
     * Current domElemet gui
     * @type {object}
     */
    this.gui = gui;
    /**
     * Current domElemet
     * @type {HTMLElement}
     */
    this.container = sceneInfo.elem;
    /**
     * Callback function
     * @type {Function}
     */
    this.screenPosCallbackFunction = screenPosCallbackFunction;
    this.callbacks = [];
    this.sceneInfo = sceneInfo;
    this.circles = [];

    this.newIndex = -1;
    this.image = null;
    this.render = null;
    // this.group = null;
  }

  /**
   * loading dicom images by using ami.js
   * @param {Array<string>} paths
   */
  async imageLoader(paths) {
    // Add participant's image.
    // Instantiate the loader that loads and parses the dicom image.

    const loader = new VolumeLoader(this.container);
    // load sequence for all files
    await loader
      .load(paths)
      .then(() => {
        let series = loader.data[0].mergeSeries(loader.data)[0];

        this.stack = series.stack[0];
        for (let frameIdx in this.stack._frame) {
          this.stack._frame[frameIdx]._imageOrientation[0] = 1;
          this.stack._frame[frameIdx]._imageOrientation[1] = 0;
          this.stack._frame[frameIdx]._imageOrientation[2] = 0;
          this.stack._frame[frameIdx]._imageOrientation[3] = 0;
          this.stack._frame[frameIdx]._imageOrientation[4] = 1;
          this.stack._frame[frameIdx]._imageOrientation[5] = 0;
        }

        this.StackHelper = stackHelperFactory(THREE);
        this.stackHelper = new this.StackHelper(this.stack);

        this.stackHelper.bbox.color = 0xf9f9f9;
        this.stackHelper.border.color = 0xf9f9f9;
        // Label mesh for use in subsequent ray interests for identifying
        // this image during gui interactions.
        this.stackHelper.slice.mesh.name = this.label;

        // this.stackHelper.position.z =
        //   this.stackHelper.position.z - this.stackHelper.slice.mesh.position.z;

        this.camera.lookAt(this.scene.position);

        this.afterLoad(this.stackHelper);
        loader.free();
      })
      .catch(function (error) {
        window.console.log("oops... something went wrong...");
        window.console.log(error);
      });
  }

  /**
   * set current render
   * @param {object} render
   */
  setRenderFunction(render) {
    this.render = render;
  }
  //   setCameraFunction(camera) {
  //     this.camera = camera;
  //   }

  /**
   * after load dicom image, then call this function to display.
   *
   */
  viewImage() {
    this.imageLoader(this.path).then(() => {
      this.addGUI(this.stackHelper);
      this.scene.add(this.stackHelper);
      return this.stackHelper;
    });
  }

  afterLoad = (stackHelper) => {
    stackHelper.position.set(
      this.stackPostion.x,
      this.stackPostion.y,
      this.stackPostion.z
    );
    this.callbacks.forEach((callback) => {
      callback.call(this, stackHelper);
    });
  };

  setImagePosition = (position, callback) => {
    if (!!position) {
      this.stackPostion = position;
    }

    if (!!callback && typeof callback === "function") {
      this.callbacks.push(callback);
    }
  };

  /**
   * add dicom image gui
   * @param {object} stackHelper
   */
  addGUI(stackHelper) {
    const stack = stackHelper.stack;
    const stackFolder = this.gui.addFolder("Stack");
    // index range depends on stackHelper orientation.
    stackFolder
      .add(stackHelper, "index", 0, stack.dimensionsIJK.z - 1)
      .step(1)
      .name("ImageLayer");

    stackFolder.open();

    const drawCircle = this.gui.addFolder("Draw Circle");
    drawCircle
      .add({ enable: false }, "enable")
      .name("Enabled")
      .onChange((v) => {
        if (v) {
          this.sceneInfo.enabledControls = false;
          this.container.addEventListener("click", clickElem);
          this.container.addEventListener("keydown", onkeydownElem);
        } else {
          this.sceneInfo.enabledControls = true;
          this.container.removeEventListener("click", clickElem);
          this.container.removeEventListener("keydown", onkeydownElem);
        }
      });

    const clickElem = (elem) => {
      if (elem.path[0].className === "abithree_scene_div") {
        const vec2 = new THREE.Vector2(elem.offsetX, elem.offsetY);

        const worldPos = convertScreenPosto3DPos(this.sceneInfo, vec2);
        const circle = createRingCircle("#47FF63");
        circle.position.set(worldPos.x, worldPos.y, worldPos.z);
        this.circles.push(circle);
        this.sceneInfo.scene.add(circle);
        if (
          !!this.screenPosCallbackFunction &&
          typeof this.screenPosCallbackFunction === "function"
        ) {
          this.screenPosCallbackFunction.call(this, this.circles);
        }
      }
    };
    const onkeydownElem = (event) => {
      if (event.key === "Backspace") {
        const circle = this.circles.pop();
        !!circle && this.sceneInfo.scene.remove(circle);
      }
    };
  }
}

export default ImageLoader;
