import * as ABIThree from "../../Copper3D/main";
import "../assets/css/style.css";
import monkey from "../assets/modules/monkey.glb";
// import { Something } from "./assets/modules/model.js";
// import "./assets/modules/testglb.js";

let container = document.getElementById("container_root");
let progressBar = document.getElementById("progressBar");
let allScenes = new ABIThree.Scenes(container, 1);

const scene1 = allScenes.getScene();

ABIThree.loadGLTFFile(monkey, scene1.scene, scene1.camera, null, progressBar);

const gui = scene1.gui;
const controler_flag = {
  cameraOpen: false,
};

gui.add(controler_flag, "cameraOpen").onChange((v) => {
  if (v) {
    let camerafolder = gui.addFolder("camera");
    camerafolder
      .add(new ABIThree.CameraHelper(scene1.camera.position, "x"), "value")
      .name("x");
    camerafolder
      .add(new ABIThree.CameraHelper(scene1.camera.position, "y"), "value")
      .name("y");
    camerafolder
      .add(new ABIThree.CameraHelper(scene1.camera.position, "z"), "value")
      .name("z");
  } else {
    for (let item of gui.foldersRecursive()) {
      if (item._title === "camera") {
        item.destroy();
      }
    }
  }
});

gui
  .addColor(new ABIThree.ColorGUIHelper(scene1.scene, "background"), "value")
  .name("background_color");

allScenes.animate();
