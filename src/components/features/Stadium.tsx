import { useEffect, useRef } from 'react';

interface StadiumProps {
  onEnter?: () => void;
  isEntered: boolean;
}

export default function Stadium({ onEnter, isEntered }: StadiumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const instancedMeshRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: any;
    let camera: any;
    let scene: any;
    let animationFrameId: number;

    const init = async () => {
      const THREE = await import('three');
      const { gsap } = await import('gsap');

      // Scene setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#050505');
      sceneRef.current = scene;

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 100, 150);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current?.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
      mainLight.position.set(50, 100, 50);
      scene.add(mainLight);

      // Stadium Ground
      const groundGeometry = new THREE.CircleGeometry(100, 64);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: '#1a4a1a', 
        roughness: 0.8,
        metalness: 0.2
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Pitch
      const pitchGeometry = new THREE.PlaneGeometry(10, 30);
      const pitchMaterial = new THREE.MeshStandardMaterial({ color: '#c2b280' });
      const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
      pitch.rotation.x = -Math.PI / 2;
      pitch.position.y = 0.01;
      scene.add(pitch);

      // Instanced Seats
      const seatCount = 5000;
      const seatGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const seatMaterial = new THREE.MeshStandardMaterial({ color: '#333' });
      const instancedMesh = new THREE.InstancedMesh(seatGeometry, seatMaterial, seatCount);
      instancedMeshRef.current = instancedMesh;

      const dummy = new THREE.Object3D();
      let count = 0;
      const rings = 15;
      const seatsPerRing = Math.floor(seatCount / rings);

      for (let r = 0; r < rings; r++) {
        const radius = 110 + r * 2;
        const height = r * 1.5;
        for (let s = 0; s < seatsPerRing; s++) {
          if (count >= seatCount) break;
          const angle = (s / seatsPerRing) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          dummy.position.set(x, height, z);
          dummy.lookAt(0, height, 0);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(count++, dummy.matrix);
        }
      }
      scene.add(instancedMesh);

      // Floodlights
      const lightCount = 4;
      for (let i = 0; i < lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2;
        const x = Math.cos(angle) * 130;
        const z = Math.sin(angle) * 130;
        
        const poleGeometry = new THREE.CylinderGeometry(0.5, 1, 50);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: '#444' });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 25, z);
        scene.add(pole);

        const spotLight = new THREE.SpotLight(0xffffff, 5000);
        spotLight.position.set(x, 50, z);
        spotLight.target.position.set(0, 0, 0);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.5;
        scene.add(spotLight);
        scene.add(spotLight.target);
      }

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    };

    init();

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer?.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const animateFlyIn = async () => {
      if (isEntered && cameraRef.current) {
        const { gsap } = await import('gsap');
        gsap.to(cameraRef.current.position, {
          x: 0,
          y: 10,
          z: 40,
          duration: 3,
          ease: 'power2.inOut',
          onUpdate: () => {
            cameraRef.current?.lookAt(0, 0, 0);
          }
        });
      }
    };
    animateFlyIn();
  }, [isEntered]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      id="stadium-canvas"
    />
  );
}
