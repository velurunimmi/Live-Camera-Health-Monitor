import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, RotateCcw, Info, Play, Pause, Compass, RefreshCw } from 'lucide-react';
import { playHeartbeatSound } from '../utils/audio';

interface ThreeRealisticHeartProps {
  bpm: number;
  isActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ThreeRealisticHeart: React.FC<ThreeRealisticHeartProps> = ({
  bpm,
  isActive,
  soundEnabled,
  onToggleSound,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);

  // Rotation & Inspection State
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0); // 0.5x, 1x, 1.8x
  const [showAnatomyLabels, setShowAnatomyLabels] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<'orbit' | 'anterior' | 'posterior' | 'left' | 'right' | 'vessels' | 'apex'>('orbit');
  const [rotateInBeat, setRotateInBeat] = useState<boolean>(true);
  const [liveBeatTorsion, setLiveBeatTorsion] = useState<number>(0);

  // References for continuous 60fps rendering without unmounting
  const autoRotateRef = useRef<boolean>(true);
  autoRotateRef.current = autoRotate;

  const rotateInBeatRef = useRef<boolean>(true);
  rotateInBeatRef.current = rotateInBeat;

  const rotationSpeedRef = useRef<number>(1.0);
  rotationSpeedRef.current = rotationSpeed;

  const bpmRef = useRef<number>(bpm);
  bpmRef.current = bpm;

  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  // 3D Multi-Axis Rotation State
  const currentRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0.15, y: 0.25, z: 0 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: 0.25 });
  const isDraggingRef = useRef<boolean>(false);

  const beatIntervalMs = Math.max(450, Math.min(1500, Math.round(60000 / (bpm || 72))));

  // Realistic Stethoscope Cardiac Audio
  useEffect(() => {
    if (!isActive || !soundEnabled) return;
    const interval = setInterval(() => {
      playHeartbeatSound(0.24);
    }, beatIntervalMs);

    return () => clearInterval(interval);
  }, [isActive, soundEnabled, beatIntervalMs]);

  // Three.js Ultra-Realistic Medical-Grade 3D Heart Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 420;

    // 1. Scene, Camera, & WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Root Assembly Group
    const heartGroup = new THREE.Group();
    heartGroupRef.current = heartGroup;
    heartGroup.position.set(0, -0.15, 0);
    scene.add(heartGroup);

    // Functional Anatomical Sub-Groups for distinct biomechanics
    const ventriclesGroup = new THREE.Group();
    const atriaGroup = new THREE.Group();
    const greatVesselsGroup = new THREE.Group();
    const coronariesGroup = new THREE.Group();
    const adiposeGroup = new THREE.Group();

    heartGroup.add(ventriclesGroup);
    heartGroup.add(atriaGroup);
    heartGroup.add(greatVesselsGroup);
    heartGroup.add(coronariesGroup);
    heartGroup.add(adiposeGroup);

    // 2. High-Fidelity Medical Procedural Textures (2048x2048 High-Resolution)
    const createPhotorealisticCardiacTextures = () => {
      // Diffuse Color & Capillary Perfusion Map
      const c = document.createElement('canvas');
      c.width = 2048;
      c.height = 2048;
      const ctx = c.getContext('2d');

      // Bump / Surface Relief Map
      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = 1024;
      bumpCanvas.height = 1024;
      const bCtx = bumpCanvas.getContext('2d');

      if (!ctx || !bCtx) {
        return {
          map: new THREE.CanvasTexture(c),
          bump: new THREE.CanvasTexture(bumpCanvas),
        };
      }

      // Base: Natural vascularized muscular gradient (mahogany to oxygenated crimson)
      const grad = ctx.createRadialGradient(1024, 1024, 120, 1024, 1024, 1024);
      grad.addColorStop(0, '#881337');
      grad.addColorStop(0.35, '#700c28');
      grad.addColorStop(0.7, '#580820');
      grad.addColorStop(1, '#3b0415');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 2048);

      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 1024, 1024);

      // Helical Myocardial Muscle Vortex Striations (Swirling fiber direction)
      for (let i = 0; i < 1800; i++) {
        const startX = Math.random() * 2048;
        const startY = Math.random() * 2048;
        const length = 120 + Math.random() * 220;
        const angle = Math.sin(startY * 0.003) * 0.5 + 0.35; // Helical vortex angle

        ctx.strokeStyle =
          Math.random() > 0.4
            ? `rgba(244, 63, 94, ${0.08 + Math.random() * 0.14})`
            : `rgba(45, 3, 15, ${0.18 + Math.random() * 0.22})`;
        ctx.lineWidth = 1.0 + Math.random() * 2.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          startX + Math.cos(angle) * (length * 0.5) + (Math.random() - 0.5) * 40,
          startY + Math.sin(angle) * (length * 0.5) + (Math.random() - 0.5) * 40,
          startX + Math.cos(angle) * length,
          startY + Math.sin(angle) * length
        );
        ctx.stroke();

        // Matching surface relief bump
        bCtx.strokeStyle = Math.random() > 0.5 ? '#b0b0b0' : '#555555';
        bCtx.lineWidth = 1.2;
        bCtx.beginPath();
        bCtx.moveTo(startX * 0.5, startY * 0.5);
        bCtx.lineTo(
          (startX + Math.cos(angle) * length) * 0.5,
          (startY + Math.sin(angle) * length) * 0.5
        );
        bCtx.stroke();
      }

      // Microvascular Arteriolar & Venular Capillary Networks (Branching red/blue lines)
      ctx.lineWidth = 0.8;
      for (let j = 0; j < 650; j++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        ctx.strokeStyle =
          Math.random() > 0.65
            ? 'rgba(254, 205, 211, 0.35)' // Arterioles
            : 'rgba(56, 189, 248, 0.25)'; // Venules

        ctx.beginPath();
        ctx.moveTo(x, y);
        let cx = x;
        let cy = y;
        for (let step = 0; step < 4; step++) {
          cx += (Math.random() - 0.45) * 35;
          cy += (Math.random() - 0.5) * 35;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

      const mapTexture = new THREE.CanvasTexture(c);
      mapTexture.wrapS = THREE.RepeatWrapping;
      mapTexture.wrapT = THREE.RepeatWrapping;

      const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
      bumpTexture.wrapS = THREE.RepeatWrapping;
      bumpTexture.wrapT = THREE.RepeatWrapping;

      return { map: mapTexture, bump: bumpTexture };
    };

    const { map: myocardiumMap, bump: myocardiumBump } = createPhotorealisticCardiacTextures();

    // 3. Photorealistic Biological Materials
    // Living Myocardium with Wet Pericardial Serous Sheen
    const myocardiumMaterial = new THREE.MeshPhysicalMaterial({
      map: myocardiumMap,
      bumpMap: myocardiumBump,
      bumpScale: 0.05,
      color: 0x9f1239,
      roughness: 0.22,
      metalness: 0.04,
      clearcoat: 1.0, // High-gloss wet biological fluid sheen
      clearcoatRoughness: 0.1,
      sheen: 0.75,
      sheenColor: new THREE.Color(0xfb7185),
      sheenRoughness: 0.2,
    });

    // Aorta & Major Arteries (Elastic thick-walled crimson-pink with wet gloss)
    const aortaMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbe123c,
      roughness: 0.18,
      metalness: 0.06,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xf43f5e),
    });

    // Pulmonary Trunk & Arteries (Deoxygenated arterial cyan/cobalt)
    const pulmonaryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.08,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      sheen: 0.35,
      sheenColor: new THREE.Color(0x38bdf8),
    });

    // Vena Cavae (Superior & Inferior - Deep venous royal blue)
    const venaCavaMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      roughness: 0.24,
      metalness: 0.06,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
    });

    // Pulmonary Veins (Oxygenated venous return - Red coral)
    const pulmonaryVeinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      roughness: 0.2,
      metalness: 0.06,
      clearcoat: 0.8,
      clearcoatRoughness: 0.14,
    });

    // Epicardial Adipose Tissue (Natural yellow-ivory fat deposits nestled in the sulci)
    const adiposeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.6,
      metalness: 0.02,
      bumpMap: myocardiumBump,
      bumpScale: 0.04,
      transparent: true,
      opacity: 0.86,
    });

    // Coronary Arteries (High-definition oxygenated arterial crimson-gold with diastolic lumen glow)
    const coronaryArteryMaterial = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xca8a04,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.12,
    });

    // Cardiac Veins (Deoxygenated blue)
    const cardiacVeinMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.38,
      roughness: 0.25,
    });

    // 4. ANATOMICAL VENTRICLES & ATRIAL SCULPTING
    // Left Ventricle: Conical, thick muscular wall extending to Apex pointing down-left
    const lvGeo = new THREE.SphereGeometry(1.48, 64, 64);
    const lvPos = lvGeo.attributes.position;
    for (let i = 0; i < lvPos.count; i++) {
      let x = lvPos.getX(i);
      let y = lvPos.getY(i);
      let z = lvPos.getZ(i);

      // Apex formation: conical tapering anteroinferiorly
      if (y < 0) {
        const factor = Math.max(0.12, 1 + y * 0.42);
        x = (x + 0.12) * factor;
        z = z * factor;
      }
      // Posterior flattening for diaphragmatic contact
      if (z < 0) {
        z *= 0.88;
      }
      lvPos.setXYZ(i, x + 0.15, y - 0.22, z);
    }
    lvGeo.computeVertexNormals();
    const leftVentricle = new THREE.Mesh(lvGeo, myocardiumMaterial);
    ventriclesGroup.add(leftVentricle);

    // Right Ventricle: Crescent-shaped anterior chamber wrapped around septum
    const rvGeo = new THREE.SphereGeometry(1.26, 56, 56);
    const rvPos = rvGeo.attributes.position;
    for (let i = 0; i < rvPos.count; i++) {
      let x = rvPos.getX(i);
      let y = rvPos.getY(i);
      let z = rvPos.getZ(i);

      // Conus arteriosus (tapering upward toward pulmonary valve)
      if (y > 0.4) {
        x *= 0.85;
        z *= 0.9;
      }
      if (y < 0) {
        const factor = Math.max(0.18, 1 + y * 0.36);
        x *= factor;
        z *= factor;
      }
      rvPos.setXYZ(i, x - 0.72, y - 0.08, z + 0.36);
    }
    rvGeo.computeVertexNormals();
    const rightVentricle = new THREE.Mesh(rvGeo, myocardiumMaterial);
    ventriclesGroup.add(rightVentricle);

    // Right Atrium & Auricle (Right heart border receiving SVC & IVC)
    const raGeo = new THREE.SphereGeometry(0.88, 40, 40);
    const raMesh = new THREE.Mesh(raGeo, myocardiumMaterial);
    raMesh.position.set(-1.22, 0.95, 0.05);
    raMesh.scale.set(1.0, 1.15, 0.9);
    atriaGroup.add(raMesh);

    // Right Auricle (muscular pectinate flap overlapping ascending aorta)
    const rAuricleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 1.1, 0.4),
      new THREE.Vector3(-0.62, 1.28, 0.68),
      new THREE.Vector3(-0.35, 1.16, 0.72),
    ]);
    const rAuricleGeo = new THREE.TubeGeometry(rAuricleCurve, 18, 0.28, 14, false);
    const rAuricle = new THREE.Mesh(rAuricleGeo, myocardiumMaterial);
    atriaGroup.add(rAuricle);

    // Left Atrium (Posterior chamber receiving 4 pulmonary veins)
    const laGeo = new THREE.SphereGeometry(0.85, 40, 40);
    const laMesh = new THREE.Mesh(laGeo, myocardiumMaterial);
    laMesh.position.set(0.88, 1.0, -0.38);
    laMesh.scale.set(0.95, 1.05, 1.0);
    atriaGroup.add(laMesh);

    // Left Auricle (appendage wrapping around root of pulmonary trunk)
    const lAuricleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.72, 1.08, 0.22),
      new THREE.Vector3(0.56, 1.18, 0.58),
      new THREE.Vector3(0.35, 0.96, 0.68),
    ]);
    const lAuricleGeo = new THREE.TubeGeometry(lAuricleCurve, 18, 0.26, 14, false);
    const lAuricle = new THREE.Mesh(lAuricleGeo, myocardiumMaterial);
    atriaGroup.add(lAuricle);

    // 5. FULL GREAT VESSELS ANATOMY (Anterior, Posterior, & Arch)
    // Ascending Aorta, Aortic Arch, and Thoracic Descending Aorta
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.6, 0.2),
      new THREE.Vector3(0.12, 1.52, 0.15),
      new THREE.Vector3(0.48, 2.18, -0.05),
      new THREE.Vector3(0.9, 1.88, -0.38),
      new THREE.Vector3(0.96, 1.02, -0.65),
      new THREE.Vector3(0.85, -0.22, -0.75), // Descending thoracic aorta behind left atrium
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 54, 0.38, 24, false);
    const aorta = new THREE.Mesh(aortaGeo, aortaMaterial);
    greatVesselsGroup.add(aorta);

    // The 3 Aortic Arch Arterial Branches:
    // 1. Brachiocephalic Trunk
    const bTrunk = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.22, 2.0, 0.02), new THREE.Vector3(0.12, 2.8, 0.12)]),
      14,
      0.13,
      14,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(bTrunk, aortaMaterial));

    // 2. Left Common Carotid Artery
    const lCarotid = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.48, 2.18, -0.05), new THREE.Vector3(0.48, 2.88, -0.02)]),
      14,
      0.11,
      14,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(lCarotid, aortaMaterial));

    // 3. Left Subclavian Artery
    const lSubclavian = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.72, 2.08, -0.2), new THREE.Vector3(0.82, 2.75, -0.18)]),
      14,
      0.1,
      14,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(lSubclavian, aortaMaterial));

    // Pulmonary Trunk and Left/Right Pulmonary Artery Bifurcation
    const ptCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 0.55, 0.6),
      new THREE.Vector3(-0.18, 1.38, 0.48),
      new THREE.Vector3(0.08, 1.68, 0.18),
      new THREE.Vector3(0.38, 1.58, -0.15),
    ]);
    const ptGeo = new THREE.TubeGeometry(ptCurve, 40, 0.35, 22, false);
    const pulmonaryTrunk = new THREE.Mesh(ptGeo, pulmonaryMaterial);
    greatVesselsGroup.add(pulmonaryTrunk);

    // Left Pulmonary Artery
    const lpaGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.38, 1.58, -0.15), new THREE.Vector3(1.25, 1.48, -0.45)]),
      18,
      0.23,
      16,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(lpaGeo, pulmonaryMaterial));

    // Right Pulmonary Artery (Passing beneath aortic arch)
    const rpaGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, 1.62, 0.05),
        new THREE.Vector3(-0.55, 1.62, -0.25),
        new THREE.Vector3(-1.25, 1.52, -0.45),
      ]),
      24,
      0.23,
      16,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(rpaGeo, pulmonaryMaterial));

    // Superior Vena Cava (SVC) entering Right Atrium
    const svcGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.95, 2.45, -0.25),
        new THREE.Vector3(-1.05, 1.75, -0.15),
        new THREE.Vector3(-1.18, 1.05, -0.05),
      ]),
      24,
      0.32,
      18,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(svcGeo, venaCavaMaterial));

    // Inferior Vena Cava (IVC) entering from diaphragmatic surface
    const ivcGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.95, 0.45, -0.45),
        new THREE.Vector3(-0.9, -0.3, -0.55),
        new THREE.Vector3(-0.85, -0.98, -0.65),
      ]),
      20,
      0.34,
      18,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(ivcGeo, venaCavaMaterial));

    // 4 POSTERIOR PULMONARY VEINS (Entering Posterior Left Atrium)
    const lspv = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(1.08, 1.25, -0.45), new THREE.Vector3(1.7, 1.35, -0.55)]),
      14,
      0.19,
      14,
      false
    );
    const lipv = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(1.08, 0.85, -0.48), new THREE.Vector3(1.7, 0.75, -0.6)]),
      14,
      0.18,
      14,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(lspv, pulmonaryVeinMaterial));
    greatVesselsGroup.add(new THREE.Mesh(lipv, pulmonaryVeinMaterial));

    const rspv = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.55, 1.25, -0.55), new THREE.Vector3(-0.25, 1.3, -0.65)]),
      16,
      0.19,
      14,
      false
    );
    const ripv = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.55, 0.85, -0.58), new THREE.Vector3(-0.25, 0.78, -0.7)]),
      16,
      0.18,
      14,
      false
    );
    greatVesselsGroup.add(new THREE.Mesh(rspv, pulmonaryVeinMaterial));
    greatVesselsGroup.add(new THREE.Mesh(ripv, pulmonaryVeinMaterial));

    // 6. EPICARDIAL ADIPOSE TISSUE PADS (Sulcus Fat Deposits)
    const antFatGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 0.85, 0.85),
        new THREE.Vector3(0.05, 0.2, 1.15),
        new THREE.Vector3(0.18, -0.45, 0.95),
        new THREE.Vector3(0.28, -1.05, 0.55),
      ]),
      26,
      0.15,
      12,
      false
    );
    adiposeGroup.add(new THREE.Mesh(antFatGeo, adiposeMaterial));

    const avFatGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.85, 0.65, 0.45),
        new THREE.Vector3(-0.45, 0.5, 0.75),
        new THREE.Vector3(0.45, 0.45, 0.65),
        new THREE.Vector3(0.85, 0.55, 0.1),
        new THREE.Vector3(0.7, 0.45, -0.45),
        new THREE.Vector3(-0.4, 0.35, -0.55),
        new THREE.Vector3(-0.85, 0.65, 0.45),
      ]),
      38,
      0.13,
      12,
      true
    );
    adiposeGroup.add(new THREE.Mesh(avFatGeo, adiposeMaterial));

    // 7. DETAILED CORONARY ARTERIES & VEINS (LAD, LCx, RCA, GCV, CS)
    // Left Anterior Descending Artery (LAD / Anterior Interventricular)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 0.82, 0.95),
      new THREE.Vector3(0.04, 0.25, 1.22),
      new THREE.Vector3(0.16, -0.42, 1.02),
      new THREE.Vector3(0.26, -1.08, 0.62),
      new THREE.Vector3(0.3, -1.48, 0.22), // Reaches Cardiac Apex
    ]);
    const ladGeo = new THREE.TubeGeometry(ladCurve, 46, 0.052, 10, false);
    const ladMesh = new THREE.Mesh(ladGeo, coronaryArteryMaterial);
    coronariesGroup.add(ladMesh);

    // LAD Diagonal Branches (D1 & D2)
    const d1Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.06, 0.22, 1.2),
        new THREE.Vector3(0.42, 0.05, 1.05),
        new THREE.Vector3(0.76, -0.15, 0.8),
      ]),
      16,
      0.038,
      8,
      false
    );
    const d2Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, -0.45, 1.0),
        new THREE.Vector3(0.55, -0.65, 0.75),
        new THREE.Vector3(0.8, -0.85, 0.4),
      ]),
      16,
      0.034,
      8,
      false
    );
    coronariesGroup.add(new THREE.Mesh(d1Geo, coronaryArteryMaterial));
    coronariesGroup.add(new THREE.Mesh(d2Geo, coronaryArteryMaterial));

    // Great Cardiac Vein (Running alongside LAD in sulcus)
    const gcvGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.24, -1.38, 0.28),
        new THREE.Vector3(0.2, -0.95, 0.68),
        new THREE.Vector3(0.1, -0.35, 1.05),
        new THREE.Vector3(-0.02, 0.32, 1.25),
        new THREE.Vector3(-0.18, 0.88, 0.98),
        new THREE.Vector3(-0.35, 0.75, 0.8),
      ]),
      38,
      0.048,
      10,
      false
    );
    coronariesGroup.add(new THREE.Mesh(gcvGeo, cardiacVeinMaterial));

    // Circumflex Artery (LCx)
    const lcxGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 0.8, 0.9),
        new THREE.Vector3(0.35, 0.72, 0.75),
        new THREE.Vector3(0.85, 0.65, 0.25),
        new THREE.Vector3(0.95, 0.55, -0.25),
        new THREE.Vector3(0.75, 0.45, -0.6),
      ]),
      30,
      0.048,
      10,
      false
    );
    coronariesGroup.add(new THREE.Mesh(lcxGeo, coronaryArteryMaterial));

    // Right Coronary Artery (RCA)
    const rcaGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.25, 0.75, 0.85),
        new THREE.Vector3(-0.55, 0.65, 0.7),
        new THREE.Vector3(-0.85, 0.45, 0.5),
        new THREE.Vector3(-0.95, 0.1, 0.25),
        new THREE.Vector3(-0.88, -0.25, -0.15),
        new THREE.Vector3(-0.65, -0.45, -0.55),
        new THREE.Vector3(-0.25, -0.85, -0.65),
        new THREE.Vector3(0.15, -1.28, -0.35),
      ]),
      46,
      0.05,
      10,
      false
    );
    coronariesGroup.add(new THREE.Mesh(rcaGeo, coronaryArteryMaterial));

    // Coronary Sinus (Large posterior venous trunk emptying into RA)
    const csGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.75, 0.45, -0.6),
        new THREE.Vector3(0.2, 0.35, -0.68),
        new THREE.Vector3(-0.35, 0.38, -0.65),
        new THREE.Vector3(-0.75, 0.45, -0.48),
      ]),
      24,
      0.095,
      14,
      false
    );
    coronariesGroup.add(new THREE.Mesh(csGeo, cardiacVeinMaterial));

    // Middle Cardiac Vein
    const mcvGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.22, -1.38, -0.15),
        new THREE.Vector3(0.12, -0.85, -0.55),
        new THREE.Vector3(0.08, -0.25, -0.68),
        new THREE.Vector3(0.15, 0.32, -0.68),
      ]),
      26,
      0.048,
      10,
      false
    );
    coronariesGroup.add(new THREE.Mesh(mcvGeo, cardiacVeinMaterial));

    // Left Marginal (Obtuse) Vein
    const lmvGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, -1.05, 0.25),
        new THREE.Vector3(0.85, -0.45, 0.35),
        new THREE.Vector3(0.92, 0.15, 0.15),
        new THREE.Vector3(0.82, 0.48, -0.25),
      ]),
      22,
      0.042,
      10,
      false
    );
    coronariesGroup.add(new THREE.Mesh(lmvGeo, cardiacVeinMaterial));

    // Anterior Cardiac Veins
    const acv1Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.65, -0.45, 0.55),
        new THREE.Vector3(-0.85, 0.05, 0.45),
        new THREE.Vector3(-0.95, 0.45, 0.25),
      ]),
      16,
      0.04,
      8,
      false
    );
    const acv2Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, -0.65, 0.65),
        new THREE.Vector3(-0.7, -0.15, 0.58),
        new THREE.Vector3(-0.88, 0.35, 0.32),
      ]),
      16,
      0.038,
      8,
      false
    );
    coronariesGroup.add(new THREE.Mesh(acv1Geo, cardiacVeinMaterial));
    coronariesGroup.add(new THREE.Mesh(acv2Geo, cardiacVeinMaterial));

    // 8. MULTI-SOURCE SURGICAL STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    // Warm Key Spotlight
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(5.5, 6.5, 7.5);
    scene.add(keyLight);

    // Cool Cyan Fill Light (Enhances muscular depth & venous distinction)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    fillLight.position.set(-6, -2, 5);
    scene.add(fillLight);

    // Backlit Crimson Rim Light (Illuminates cardiac contour & borders)
    const rimLight = new THREE.DirectionalLight(0xf43f5e, 3.2);
    rimLight.position.set(0, -6, -6);
    scene.add(rimLight);

    // Internal Hemodynamic Myocardial Core Pulse
    const coreLight = new THREE.PointLight(0xff1e56, 3.2, 7.5);
    coreLight.position.set(0, 0, 0);
    heartGroup.add(coreLight);

    // Scale heart group for ideal viewport presence
    heartGroup.scale.set(1.15, 1.15, 1.15);

    // 9. INTERACTIVE 360° MOUSE & TOUCH ORBIT CONTROLS
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationRef.current.y += deltaX * 0.009;
      targetRotationRef.current.x += deltaY * 0.009;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotationRef.current.y += deltaX * 0.009;
      targetRotationRef.current.x += deltaY * 0.009;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 10. REALISTIC ORGANIC BEATING & CONTINUOUS 3D MULTI-AXIS ROTATION LOOP
    let animationFrameId: number;

    const animate = () => {
      const time = performance.now();
      const currentBpm = bpmRef.current || 72;
      const currentIsActive = isActiveRef.current;
      const periodSec = 60 / currentBpm;
      const phase = ((time / 1000) % periodSec) / periodSec;

      // CONTINUOUS 3D MULTI-AXIS ROTATION
      // When autoRotate is active and user is not manually dragging:
      if (autoRotateRef.current && !isDraggingRef.current) {
        // Continuous smooth Y rotation (panoramic 360° turnaround)
        targetRotationRef.current.y += 0.010 * rotationSpeedRef.current;

        // Smooth dynamic vertical pitch (reveals top vessels and bottom apex)
        const pitchOscillation = Math.sin(time * 0.0006) * 0.24;
        targetRotationRef.current.x = 0.12 + pitchOscillation;
      }

      // Smooth interpolation to target orientation
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;
      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;

      heartGroup.rotation.y = currentRotationRef.current.y;
      heartGroup.rotation.x = currentRotationRef.current.x;

      // Subtle natural Z-axis roll during continuous rotation
      if (autoRotateRef.current && !isDraggingRef.current) {
        heartGroup.rotation.z = Math.cos(time * 0.00045) * 0.08;
      }

      // BIOMECHANICAL ORGANIC BEATING MECHANICS (Wiggers Cardiac Cycle)
      if (currentIsActive) {
        let vScaleX = 1.0;
        let vScaleY = 1.0;
        let vScaleZ = 1.0;
        let apexTwist = 0.0;
        let aScale = 1.0;
        let aortaPulse = 1.0;
        let coreLightPower = 2.4;
        let coronaryGlow = 0.45;
        let mediastinumHeave = 0.0;

        if (phase < 0.16) {
          // 1. VENTRICULAR SYSTOLE (Isovolumetric contraction + Rapid Ejection)
          // Powerful longitudinal contraction: apex pulls towards base
          const p = Math.sin((phase / 0.16) * Math.PI);
          vScaleX = 1.0 + p * 0.16;
          vScaleY = 1.0 - p * 0.14; // Apical shortening
          vScaleZ = 1.0 + p * 0.13;
          apexTwist = p * 0.15; // Apical counter-clockwise helical whorl torsion (~8.6°)
          aortaPulse = 1.0 + p * 0.14; // Strong systolic aortic stroke pulse wave
          coreLightPower = 4.2 + p * 3.5;
          mediastinumHeave = p * 0.05; // Heart thrusts slightly forward toward anterior wall
        } else if (phase < 0.26) {
          // 2. END OF EJECTION
          const p = 1.0 - (phase - 0.16) / 0.1;
          vScaleX = 1.0 + p * 0.06;
          vScaleY = 1.0 - p * 0.03;
          vScaleZ = 1.0 + p * 0.05;
          apexTwist = p * 0.04;
          aortaPulse = 1.0 + p * 0.06;
          coreLightPower = 3.2;
        } else if (phase < 0.38) {
          // 3. DICROTIC NOTCH (Semilunar valve closure rebound snap - S2)
          const p = Math.sin(((phase - 0.26) / 0.12) * Math.PI);
          vScaleX = 1.0 + p * 0.08;
          vScaleY = 1.0 - p * 0.04;
          vScaleZ = 1.0 + p * 0.07;
          apexTwist = -p * 0.03;
          aortaPulse = 1.0 + p * 0.08;
          coreLightPower = 3.6;
          coronaryGlow = 0.75 + p * 0.4; // Coronary perfusion begins during early diastole!
        } else if (phase < 0.86) {
          // 4. DIASTOLIC RELAXATION & RAPID VENTRICULAR FILLING
          vScaleX = 1.0;
          vScaleY = 1.0;
          vScaleZ = 1.0;
          apexTwist = 0.0;
          aScale = 1.0;
          coreLightPower = 2.2;
          coronaryGlow = 0.55;
        } else {
          // 5. ATRIAL KICK (Presystolic atrial contraction topping off ventricles)
          const p = Math.sin(((phase - 0.86) / 0.14) * Math.PI);
          aScale = 1.0 - p * 0.12; // Sharp atrial contraction
          coreLightPower = 2.8;
        }

        ventriclesGroup.scale.set(vScaleX, vScaleY, vScaleZ);
        ventriclesGroup.rotation.y = apexTwist;
        atriaGroup.scale.set(aScale, aScale, aScale);
        aorta.scale.set(aortaPulse, 1.0, aortaPulse);
        pulmonaryTrunk.scale.set(aortaPulse, 1.0, aortaPulse);
        coreLight.intensity = coreLightPower;
        coronaryArteryMaterial.emissiveIntensity = coronaryGlow;

        // Dynamic 3D Rotation in Heartbeat (Helical Wringing Torsion & Anterior Wall Thrust)
        const isBeatRot = rotateInBeatRef.current;
        const torsionAngle = isBeatRot ? apexTwist * 1.6 : 0;
        const pitchThrust = isBeatRot ? mediastinumHeave * 1.8 : 0;
        const yawRecoil = isBeatRot ? -apexTwist * 0.65 : 0;

        heartGroup.rotation.z =
          (autoRotateRef.current && !isDraggingRef.current ? Math.cos(time * 0.00045) * 0.08 : 0) +
          torsionAngle;
        heartGroup.rotation.x = currentRotationRef.current.x + pitchThrust;
        heartGroup.rotation.y = currentRotationRef.current.y + yawRecoil;
        heartGroup.position.z = isBeatRot ? mediastinumHeave * 1.2 : 0;
      } else {
        // Standby baseline resting pulse
        const idle = 1.0 + Math.sin(time / 900) * 0.025;
        heartGroup.scale.set(1.15 * idle, 1.15 * idle, 1.15 * idle);
        coreLight.intensity = 1.8;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Responsive Canvas Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      myocardiumMap.dispose();
      myocardiumBump.dispose();
      lvGeo.dispose();
      rvGeo.dispose();
      raGeo.dispose();
      rAuricleGeo.dispose();
      laGeo.dispose();
      lAuricleGeo.dispose();
      aortaGeo.dispose();
      bTrunk.dispose();
      lCarotid.dispose();
      lSubclavian.dispose();
      ptGeo.dispose();
      lpaGeo.dispose();
      rpaGeo.dispose();
      svcGeo.dispose();
      ivcGeo.dispose();
      lspv.dispose();
      lipv.dispose();
      rspv.dispose();
      ripv.dispose();
      antFatGeo.dispose();
      avFatGeo.dispose();
      ladGeo.dispose();
      d1Geo.dispose();
      d2Geo.dispose();
      gcvGeo.dispose();
      lcxGeo.dispose();
      rcaGeo.dispose();
      csGeo.dispose();
      mcvGeo.dispose();
      lmvGeo.dispose();
      acv1Geo.dispose();
      acv2Geo.dispose();
    };
  }, []);

  // Preset Anatomical View Angle Setter (Inspect From All Sides)
  const setAnatomicalAngle = useCallback(
    (angle: 'orbit' | 'anterior' | 'posterior' | 'left' | 'right' | 'vessels' | 'apex') => {
      setActivePreset(angle);
      if (angle === 'orbit') {
        setAutoRotate(true);
        targetRotationRef.current = { x: 0.15, y: currentRotationRef.current.y };
      } else if (angle === 'anterior') {
        setAutoRotate(false);
        targetRotationRef.current = { x: 0.15, y: 0.25 };
      } else if (angle === 'posterior') {
        setAutoRotate(false);
        targetRotationRef.current = { x: 0.1, y: Math.PI + 0.25 };
      } else if (angle === 'left') {
        setAutoRotate(false);
        targetRotationRef.current = { x: 0.15, y: Math.PI / 2 + 0.2 };
      } else if (angle === 'right') {
        setAutoRotate(false);
        targetRotationRef.current = { x: 0.15, y: -Math.PI / 2 + 0.2 };
      } else if (angle === 'vessels') {
        setAutoRotate(false);
        targetRotationRef.current = { x: 0.72, y: 0.15 };
      } else if (angle === 'apex') {
        setAutoRotate(false);
        targetRotationRef.current = { x: -0.65, y: 0.35 };
      }
    },
    []
  );

  const toggleAutoRotate = () => {
    setAutoRotate((prev) => !prev);
  };

  const cycleSpeed = () => {
    setRotationSpeed((prev) => {
      if (prev === 1.0) return 1.8;
      if (prev === 1.8) return 0.5;
      return 1.0;
    });
  };

  const rrInterval = Math.round(60000 / (bpm || 72));

  return (
    <div className="relative flex flex-col items-center justify-between p-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl select-none min-h-[490px] group overflow-hidden">
      {/* Background radial surgical glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-70"
        style={{
          background: isActive
            ? 'radial-gradient(circle at center, rgba(225, 29, 72, 0.3) 0%, rgba(15, 23, 42, 0) 75%)'
            : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0) 75%)',
        }}
      />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isActive ? 'bg-rose-400 opacity-75' : 'bg-slate-500 opacity-40'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive ? 'bg-rose-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 font-mono">
            3D ANATOMY • ALL SIDES ROTATED IN HEARTBEAT
          </span>
        </div>

        {/* Top Control Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Rotated in Beat Toggle */}
          <button
            onClick={() => setRotateInBeat(!rotateInBeat)}
            title={rotateInBeat ? 'Disable Heartbeat Rotation' : 'Enable Rotation in Heartbeat'}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              rotateInBeat
                ? 'bg-rose-950/90 border-rose-500/70 text-rose-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${rotateInBeat ? 'animate-spin' : ''}`} />
            <span>BEAT ROTATE</span>
          </button>

          {/* Auto-Rotation Toggle */}
          <button
            onClick={toggleAutoRotate}
            title={autoRotate ? 'Pause 3D Rotation' : 'Resume Continuous 3D Rotation'}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              autoRotate
                ? 'bg-indigo-950/80 border-indigo-500/70 text-indigo-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoRotate ? (
              <>
                <Pause className="w-3 h-3 text-indigo-400" />
                <span>ROTATING 3D</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-slate-400" />
                <span>PAUSED</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          <button
            onClick={cycleSpeed}
            title="Toggle rotation speed"
            className="flex items-center gap-0.5 text-[10px] font-mono px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <span>{rotationSpeed}x</span>
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowAnatomyLabels(!showAnatomyLabels)}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              showAnatomyLabels
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>LABELS</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Heartbeat Sound' : 'Enable Heartbeat Sound'}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-xl transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-rose-400 text-[10px]">SOUND</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[10px]">MUTED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="relative w-full h-84 sm:h-92 flex items-center justify-center cursor-grab active:cursor-grabbing my-auto"
      >
        {/* Anatomical Structure Callouts (Visible when LABELS toggled on) */}
        {showAnatomyLabels && (
          <div className="absolute inset-0 pointer-events-none z-20 text-[9px] font-mono select-none">
            {/* Aortic Arch Tag */}
            <div className="absolute top-4 left-[50%] -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/90 border border-rose-500/70 text-rose-300 shadow-md">
              Aortic Arch &amp; Brachiocephalic
            </div>
            {/* Pulmonary Trunk Tag */}
            <div className="absolute top-16 left-6 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-500/70 text-cyan-300 shadow-md">
              Pulmonary Trunk &amp; Arteries
            </div>
            {/* Superior Vena Cava Tag */}
            <div className="absolute top-16 right-6 px-2 py-0.5 rounded bg-slate-950/90 border border-blue-500/70 text-blue-300 shadow-md">
              Superior Vena Cava
            </div>
            {/* LAD Coronary Tag */}
            <div className="absolute bottom-24 left-8 px-2 py-0.5 rounded bg-slate-950/90 border border-amber-500/70 text-amber-300 shadow-md">
              LAD Coronary &amp; Great Cardiac Vein
            </div>
            {/* Left Ventricle & Apex Tag */}
            <div className="absolute bottom-6 right-8 px-2 py-0.5 rounded bg-slate-950/90 border border-emerald-500/70 text-emerald-300 shadow-md">
              Left Ventricle / Vortex Apex
            </div>
          </div>
        )}

        {/* Subtle dragging hint on hover */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Click &amp; drag to inspect from any angle</span>
        </div>
      </div>

      {/* Anatomical View Presets Bar & Live Cardiac R-R Telemetry */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 z-10 pt-3 border-t border-slate-800 text-xs font-mono">
        {/* Preset Angle Buttons for All-Sides Inspection */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-500 mr-1 uppercase">ALL-SIDES VIEW:</span>
          <button
            onClick={() => setAnatomicalAngle('orbit')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'orbit' && autoRotate
                ? 'bg-indigo-950/90 border border-indigo-500/60 text-indigo-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            360° ORBIT
          </button>
          <button
            onClick={() => setAnatomicalAngle('anterior')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'anterior'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            ANTERIOR
          </button>
          <button
            onClick={() => setAnatomicalAngle('posterior')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'posterior'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            POSTERIOR
          </button>
          <button
            onClick={() => setAnatomicalAngle('left')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'left'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            LEFT LATERAL
          </button>
          <button
            onClick={() => setAnatomicalAngle('right')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'right'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            RIGHT LATERAL
          </button>
          <button
            onClick={() => setAnatomicalAngle('vessels')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'vessels'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            VESSELS
          </button>
          <button
            onClick={() => setAnatomicalAngle('apex')}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              activePreset === 'apex'
                ? 'bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            APEX
          </button>
          <button
            onClick={() => {
              setAnatomicalAngle('orbit');
            }}
            title="Reset to 360° orbit rotation"
            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Live Cardiac Status Readout */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-cyan-400">
            R-R: {isActive ? `${rrInterval}ms` : '--'}
          </span>
          <span className="text-rose-400 font-bold">
            {isActive ? `${bpm} BPM Live` : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
