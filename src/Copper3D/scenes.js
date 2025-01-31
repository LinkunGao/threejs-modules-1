import * as THREE from "three";
import { createLight } from "./base";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * @module Scenes
 */

/**
 * Base class for making multiple scenes, it includes webGLRender, camera information, three.js controls.
 * The default number of scene is one, and the default camera position is { x: 0, y: 0, z: 500 }.
 * @example
 * const allScenes = new Scenes(HTMLElement, 4, {0, 0, 1000});
 * allScenes.animate();
 */

class Scenes {
  constructor(container, numberOfScene, cameraPosition) {
    /**
     * How many scenes the user want to create.
     * @type {number}
     * */
    this.numberOfScene = numberOfScene > 0 ? numberOfScene : 1;
    /**
     * The main container for all scenes
     * @type {HTMLElement}
     */
    this.container = container;
    /**
     * The camera postion, it is a object and the format is {x:number, y:number, z:number}
     * @type {object}
     * @example
     * { x: 0, y: 0, z: 1000 }
     */
    this.cameraPosition = cameraPosition || { x: 0, y: 0, z: 500 };
    /**
     * It stores all scenes' parent domElements.
     * @type {Array}
     */
    this.elems = [];
    /**
     * It stores all scenes.
     * @type {Array}
     */
    this.scenes = [];
    /**
     * It stores all camera information.
     * @type {Array}
     */
    this.cameras = [];
    /**
     * It stores all scenes' information. Each scene's info includes scene's ID, scene,camera, domElement, controls, GUI.
     */
    this.sceneInfos = [];

    this.init();
    // this.animate();
  }

  /**
   * The initial function.
   * It will create a WebGLRenderer, and depends on the number of scenes to create each scene and it's parent domElement.
   * And it also can automatically create gui for each scene.
   * All the informations will be stored in the sceneInfo object, such as:  scene,camera, domElement, controls, GUI.
   */
  init() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.canvas = this.renderer.domElement;
    this.canvas.className = "abithree_canvas";
    this.container.className = "abithree_container_root";
    this.container.appendChild(this.canvas);
    for (let i = 0; i < this.numberOfScene; i++) {
      const elem = document.createElement("div");
      elem.className = "abithree_scene_div";
      this.container.appendChild(elem);

      this.elems.push(elem);
      const gui = new GUI({ container: elem });
      const sceneInfo = this.makeScene(elem, this.cameraPosition);
      sceneInfo.id = i;
      sceneInfo.elem = elem;
      sceneInfo.gui = gui;
      sceneInfo.enabledControls = true;
      this.scenes.push(sceneInfo.scene);
      this.cameras.push(sceneInfo.camera);
      this.sceneInfos.push(sceneInfo);
    }
  }
  /**
   * This functions is for init function to create multiple scenes.
   * @param {HTMLElement} elem - the scene parent domElement.
   * @param {object} cameraPosition - the cameraPostion
   * @returns {object}- {scene, camera, controls}
   */
  makeScene(elem, cameraPosition) {
    const scene = new THREE.Scene();

    const fov = 75;
    const aspect = elem.clientWidth / elem.clientHeight;
    const near = 0.1;
    const far = 1000;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(scene.position);
    scene.add(camera);
    // const controls = new TrackballControls(camera, elem);
    const controls = new OrbitControls(camera, elem);
    controls.enabled = false;
    // light
    {
      const color = 0xffffff;
      const intensity = 1;
      const light = createLight(color, intensity);
      scene.add(light.pointLight);

      const cameraLight = new THREE.DirectionalLight(color, intensity);
      cameraLight.position.set(-1, 2, 4);
      camera.add(cameraLight);
    }
    scene.background = new THREE.Color("black");

    return { scene, camera, controls };
  }
  /**
   * Get the scene infomation with the corresponding id by entering the  parameter ID.
   * @param {Number} id
   * @returns {Scenes} - If found the id of the scence
   *
   * @example
   * const scene = getScene()
   * const sceneTwo = getScene(1)
   */
  getScene(id = 0) {
    const scene = this.sceneInfos.find((element) => element.id === id);
    if (scene) {
      return scene;
    } else {
      console.log("Oops...No scenes have been found!");
    }
  }

  /**
   * This function is for render all scenes on canvas.
   * @param {object} sceneInfo
   *
   */
  renderSceneInfo = (sceneInfo) => {
    const { scene, camera, controls, elem } = sceneInfo;

    // get the viewpoint relative position of this element
    const { left, right, top, bottom, width, height } =
      elem.getBoundingClientRect();
    const isOffscreen =
      bottom < 0 ||
      top > this.renderer.domElement.clientHeight ||
      right < 0 ||
      left > this.renderer.domElement.clientWidth;
    if (isOffscreen) {
      return;
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // controls.handleResize();
    controls.update();

    const positiveYUpBottom = this.renderer.domElement.clientHeight - bottom;
    this.renderer.setScissor(left, positiveYUpBottom, width, height);
    this.renderer.setViewport(left, positiveYUpBottom, width, height);
    this.renderer.render(scene, camera);
  };

  /**
   * This method causes the layout of the canvas to change responsively with the user's window.
   */
  resizeRendererToDisplaySize = () => {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    const needResize =
      this.renderer.domElement.width !== width ||
      this.renderer.domElement.height !== height;
    if (needResize) {
      // to create a grid for multiple scenes
      this.elems.map((elem, index) => {
        if (index === this.numberOfScene - 1 && this.numberOfScene % 2 !== 0) {
          elem.style.width = this.container.clientWidth + "px";
        } else {
          elem.style.width = this.container.clientWidth / 2 - 2 + "px";
        }
        elem.style.height =
          this.container.clientHeight / Math.ceil(this.numberOfScene / 2) +
          "px";
      });
      this.renderer.setSize(width, height, false);
    }
  };

  /**
   * This function is for create animation and render the canvas.
   *
   * @param {number} time
   */
  animate = (time) => {
    time *= 0.001;
    const clearColor = new THREE.Color("#000");
    this.renderer.setScissorTest(false);
    this.renderer.setClearColor(clearColor, 0);
    this.renderer.clear(true, true);
    this.renderer.setScissorTest(true);
    this.resizeRendererToDisplaySize();

    // for (let info of this.sceneInfos) {
    // }
    this.sceneInfos.forEach((info) => {
      this.renderSceneInfo(info);
    });

    this.enabledElementControls();

    const transform = `translateY(${window.scrollY}px)`;
    this.renderer.domElement.style.transform = transform;

    window.requestAnimationFrame(this.animate);
  };

  enabledElementControls = () => {
    const infos = this.sceneInfos;
    infos.forEach((info) => {
      if (info.enabledControls) {
        info.elem.onmouseover = (event) => {
          let el = event.target.className; //when mouse over which element then get the element classname
          if (el === "abithree_scene_div") {
            info.controls.enabled = true;
            info.controls.update();
          } else {
            info.controls.enabled = false;
            info.controls.update();
          }
        };
      } else {
        info.elem.onmouseover = null;
      }
    });
  };
}

export default Scenes;
