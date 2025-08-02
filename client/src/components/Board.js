import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const GRID_SIZE = 4;
const goldPos = { x: 3, y: 3 };
const pitPositions = [{ x: 1, y: 2 }, { x: 2, y: 0 }];
const wumpusPos = { x: 2, y: 2 };

const Board = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const agentRef = useRef(null);
  const agentPosRef = useRef({ x: 0, y: 0 });
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [agentDir, setAgentDir] = useState("E");

  useEffect(() => {
    agentPosRef.current = agentPos;
  }, [agentPos]);

  const get3DPosition = (x, y) => ({ x: x - 1.5, y: 0, z: y - 1.5 });

  const moveAgentForward = (dir) => {
    const { x, y } = agentPosRef.current;
    let dx = 0, dy = 0;
    if (dir === "N") dy = -1;
    else if (dir === "S") dy = 1;
    else if (dir === "E") dx = 1;
    else if (dir === "W") dx = -1;

    const newX = Math.max(0, Math.min(GRID_SIZE - 1, x + dx));
    const newY = Math.max(0, Math.min(GRID_SIZE - 1, y + dy));
    setAgentDir(dir);
    setAgentPos({ x: newX, y: newY });
  };

  const createArrow = (dir, onClick, position) => {
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    arrow.rotation.x = -Math.PI / 2;
    if (dir === 'N') arrow.rotation.z = 0;
    if (dir === 'E') arrow.rotation.z = -Math.PI / 2;
    if (dir === 'S') arrow.rotation.z = Math.PI;
    if (dir === 'W') arrow.rotation.z = Math.PI / 2;
    arrow.position.set(...position);
    arrow.name = dir;
    return arrow;
  };

  useEffect(() => {
    const width = 600;
    const height = 600;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 6, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.1, 0.95),
          new THREE.MeshStandardMaterial({ color: 0xeeeeee })
        );
        const pos = get3DPosition(x, y);
        tile.position.set(pos.x, -0.05, pos.z);
        scene.add(tile);
      }
    }

    const agent = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    scene.add(agent);
    agentRef.current = agent;

    const gold = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    const gPos = get3DPosition(goldPos.x, goldPos.y);
    gold.position.set(gPos.x, 0.3, gPos.z);
    scene.add(gold);

    pitPositions.forEach(p => {
      const pit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      const pos = get3DPosition(p.x, p.y);
      pit.position.set(pos.x, 0, pos.z);
      scene.add(pit);
    });

    const wumpus = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    const wPos = get3DPosition(wumpusPos.x, wumpusPos.y);
    wumpus.position.set(wPos.x, 0.3, wPos.z);
    scene.add(wumpus);

    const arrows = [
      createArrow('N', () => moveAgentForward('N'), [0, 1.2, -3.5]),
      createArrow('S', () => moveAgentForward('S'), [0, 1.2, 3.5]),
      createArrow('E', () => moveAgentForward('E'), [3.5, 1.2, 0]),
      createArrow('W', () => moveAgentForward('W'), [-3.5, 1.2, 0]),
    ];
    arrows.forEach(arrow => scene.add(arrow));

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children);
      for (const intersect of intersects) {
        const dir = intersect.object.name;
        if (["N", "S", "E", "W"].includes(dir)) {
          moveAgentForward(dir);
          break;
        }
      }
    };

    renderer.domElement.addEventListener('click', onClick);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  useEffect(() => {
    if (agentRef.current) {
      const pos = get3DPosition(agentPos.x, agentPos.y);
      agentRef.current.position.set(pos.x, 0.3, pos.z);

      if (agentPos.x === wumpusPos.x && agentPos.y === wumpusPos.y) alert("Wumpus got you! Game Over.");
      if (pitPositions.some(p => p.x === agentPos.x && p.y === agentPos.y)) alert("You fell into a pit! Game Over.");
      if (agentPos.x === goldPos.x && agentPos.y === goldPos.y) alert("You found the gold! You win!");
    }
  }, [agentPos]);

 return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
    {/* Legend Section */}
    <div style={{
      marginBottom: 20,
      padding: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      fontSize: '14px',
      display: 'flex',
      gap: '20px',
      justifyContent: 'center'
    }}>
      <div><span style={{ color: 'blue', fontWeight: 'bold' }}></span>Blue Cube: Agent</div>
      <div><span style={{ color: 'red', fontWeight: 'bold' }}></span> Red Cube: Wumpus</div>
      <div><span style={{ color: 'gold', fontWeight: 'bold' }}></span>Yellow Cube: Gold</div>
      <div><span style={{ color: '#222', fontWeight: 'bold' }}></span>Black Cylinder: Pit</div>
    </div>

    {/* Game Board */}
    <div ref={mountRef} />
  </div>
);

};

export default Board;
