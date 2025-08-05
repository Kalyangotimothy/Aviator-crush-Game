import { AnimatedSprite, Container, Graphics, Sprite, Text, useTick } from "@pixi/react";
import { TextStyle, Texture, Graphics as GraphicsRaw, ColorMatrixFilter } from "pixi.js";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { renderCurve as _renderCurve, createGradTexture, curveFunction, maskDraw as _drawMask, smoothen, _drawOuterBoundery, _drawInnerBoundery, interpolate, webpORpng } from "../../utils";
import { dimensionType, gameAnimStatusType } from "../../@types";

const AppStage = ({ payout, game_anim_status, dimension, pixiDimension }: { payout: number, game_anim_status: gameAnimStatusType, dimension: dimensionType, pixiDimension: dimensionType }) => {

    const tickRef = useRef(0)
    const [hueRotate, setHueRotate] = useState(0)
    const [planeScale, setPlaneScale] = useState(0.2)
    const [pulseBase, setPulseBase] = useState(0.8)
    const [planeFrames, setPlaneFrames] = useState<Texture[] | undefined>()
    const [planeX, setPlaneX] = useState(0)
    const [ontoCorner, setOntoCorner] = useState(0)

    const renderCurve = useCallback((g: GraphicsRaw) => _renderCurve(g, dimension), [dimension])
    const drawOuterBoundery = useCallback((g: GraphicsRaw) => _drawOuterBoundery(g, dimension), [dimension])
    const drawInnerBoundery = useCallback((g: GraphicsRaw) => _drawInnerBoundery(g, dimension), [dimension])



    const gradTexture = useMemo(() => createGradTexture(dimension), [dimension])

    const handleResize = useCallback(() => {
        setPlaneScale(interpolate(window.innerWidth, 400, 1920, 0.5, 0.2))
        setPulseBase(interpolate(window.innerWidth, 400, 1920, 0.6, 0.8))
    }, [])
    useEffect(() => {
        const _plane: Texture[] = []
        if (process.env.NODE_ENV === 'development') {
            // Create a simple plane texture for development
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear background
                ctx.fillStyle = 'transparent';
                ctx.fillRect(0, 0, 64, 64);

                // Draw a more visible plane shape
                ctx.fillStyle = '#ff0000';
                // Body
                ctx.fillRect(10, 28, 44, 8);
                // Wings
                ctx.fillRect(25, 20, 14, 24);
                // Tail
                ctx.fillRect(50, 24, 8, 16);
                // Cockpit
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(8, 30, 8, 4);

                console.log('Created plane texture for development');
            }
            const devTexture = Texture.from(canvas);
            for (let i = 1; i <= 15; i++) {
                _plane.push(devTexture);
            }
        } else {
            for (let i = 1; i <= 15; i++) {
                _plane.push(Texture.from(`plane-anim-${i}.${webpORpng}`));
            }
        }
        setPlaneFrames(_plane)
        console.log('Plane frames set:', _plane.length, 'frames')
        const t_out = setInterval(() => setOntoCorner(prev => (prev + 1) % 100), 100)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            clearInterval(t_out)
            // Clean up textures to prevent memory leaks
            if (process.env.NODE_ENV === 'development') {
                _plane.forEach(texture => {
                    if (texture && texture.destroy) {
                        texture.destroy();
                    }
                });
            }
        }
    }, [handleResize])

    useTick((delta) => {
        setHueRotate(prev => (prev + delta / 500))
    });

    const maskRef = useRef<GraphicsRaw>(null);
    const dotRef = useRef<GraphicsRaw>(null);
    const gameBoardMask = useRef<GraphicsRaw>(null);



    const curveMask = useCallback((g: GraphicsRaw) => _drawMask(g, { width: dimension.width - 40, height: dimension.height - 40 }), [dimension])
    const dotLeftBottom = useCallback((g: GraphicsRaw) => _drawMask(g, { width: 1, height: 1 }), [])



    const [pulseGraph, setPulseGraph] = useState(1);
    useTick((delta) => {
        if (game_anim_status !== "ANIM_STARTED") return
        const amp = 0.06
        tickRef.current += delta * 0.01
        const pulse = Math.sin(tickRef.current) * amp
        setPulseGraph(pulse)
        updatePlaneX()
    })
    // Update plane X position based on tick
    const updatePlaneX = useCallback(() => {
        const newX = smoothen(Math.min(tickRef.current * 300, dimension.width - 40), { width: dimension.width - 40, height: dimension.height - 40 });
        setPlaneX(newX);
    }, [dimension.width, dimension.height]);

    useEffect(() => {
        updatePlaneX();
    }, [updatePlaneX]);
    useEffect(() => {
        if (game_anim_status === "WAITING") tickRef.current = 0
        if (game_anim_status === "ANIM_CRASHED") setOntoCorner(0)
    }, [game_anim_status])

    // Find the peak x value for the curve
    const findPeakX = useCallback(() => {
        let peakX = 0;
        let peakY = -Infinity;
        for (let x = 0; x <= dimension.width - 40; x += 1) {
            const y = curveFunction(x, { width: dimension.width - 40, height: dimension.height - 40 });
            if (y > peakY) {
                peakY = y;
                peakX = x;
            }
        }
        return peakX;
    }, [dimension]);

    const posPlane = useMemo(() => {
        const xPeak = findPeakX();
        const yPeak = curveFunction(xPeak, { width: dimension.width - 40, height: dimension.height - 40 });
        return {
            x: xPeak + 40,
            y: dimension.height - 40 - yPeak
        };
    }, [findPeakX, dimension]);

    const colorMatrix = useMemo(() => {
        const c = new ColorMatrixFilter();
        c.hue(hueRotate * 100, true);
        return c
    }, [hueRotate])

    const payoutTextStyle = useMemo(() => new TextStyle({
        align: 'center',
        fontFamily: 'Roboto',
        fontSize: 160,
        fontWeight: '700',
        fill: ['#ffffff', '#ffffff'],
        stroke: '#111111',
        strokeThickness: 2,
        letterSpacing: 0,
        dropShadow: false,
        dropShadowColor: '#ccced2',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
    }), [])

    return (
        <Container>
            <Sprite filters={[colorMatrix]} texture={gradTexture} width={dimension.width - 40} height={dimension.height - 40} position={{ x: 40, y: 0 }} />
            <Sprite
                image={process.env.NODE_ENV === 'development' ?
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K' :
                    `${process.env.REACT_APP_ASSETS_IMAGE_URL}${webpORpng}/sun-like-bg.${webpORpng}`}
                anchor={0.5}
                x={-100} y={dimension.height + 100}
                rotation={hueRotate}
                scale={2}
            />
            <Graphics ref={gameBoardMask} draw={dotLeftBottom} x={40} scale={{ x: dimension.width - 40, y: dimension.height - 40 }} />
            <Container mask={gameBoardMask.current} visible={game_anim_status === "ANIM_STARTED"} position={{ x: 40, y: 0 }} scale={{ x: 1, y: 1 }}>
                <Graphics
                    mask={maskRef.current}
                    draw={renderCurve}
                    position={{ x: 0, y: dimension.height - 40 }}
                    scale={{ x: pulseBase + pulseGraph, y: 1 - pulseGraph }}
                    pivot={{ x: 0, y: dimension.height - 40 }} />
                <Graphics
                    scale={{ x: (pulseBase + pulseGraph) * planeX / (dimension.width - 40), y: 1 }}
                    name="mask"
                    draw={curveMask}
                    ref={maskRef}
                />
            </Container>
            <Container visible={true}>
                {planeFrames !== undefined && (
                    <AnimatedSprite
                        rotation={process.env.NODE_ENV === 'development' ? 0 : -Math.PI / 10}
                        pivot={{ x: 0.08, y: 0.54 }}
                        textures={planeFrames}
                        anchor={{ x: 0.07, y: 0.55 }}
                        scale={process.env.NODE_ENV === 'development' ? 2.0 : planeScale}
                        animationSpeed={0.5}
                        isPlaying={true}
                        initialFrame={0}
                        position={posPlane}

                    />)}
                <Text
                    visible={game_anim_status === "ANIM_STARTED"}
                    text={payout.toFixed(2) + "x"}
                    anchor={0.5}
                    x={dimension.width / 2}
                    y={dimension.height / 2}
                    style={payoutTextStyle}
                />

            </Container>
            <Graphics draw={drawInnerBoundery} />
            <Container ref={dotRef}>
                <Graphics draw={dotLeftBottom} scale={{ x: 40, y: dimension.height - 40 }} />
                <Graphics position={{ x: 40, y: dimension.height - 40 }} scale={{ x: dimension.width - 40, y: 40 }} draw={dotLeftBottom} />
            </Container>
            <Container mask={dotRef.current}>
                {useMemo(() => {
                    const dotImage = process.env.NODE_ENV === 'development' ?
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K' :
                        `${process.env.REACT_APP_ASSETS_IMAGE_URL}${webpORpng}/dot.${webpORpng}`;

                    const animOffset = hueRotate * 400 % (140000 / pixiDimension.width);

                    return Array.from({ length: 30 }, (_, i) => {
                        const coor = i * 140000 / pixiDimension.width + 10;
                        return (
                            <Container key={i}>
                                <Sprite
                                    scale={0.4}
                                    image={dotImage}
                                    anchor={0.5}
                                    x={20}
                                    y={coor + animOffset - 100}
                                />
                                <Sprite
                                    scale={0.4}
                                    image={dotImage}
                                    anchor={0.5}
                                    x={coor - animOffset - 100}
                                    y={dimension.height - 20}
                                />
                            </Container>
                        );
                    });
                }, [hueRotate, pixiDimension.width, dimension.height])}
            </Container>
            <Graphics draw={drawOuterBoundery} />

            {/* <WaitingSprite visible={game_anim_status === "WAITING"} dimension={dimension} /> */}

        </Container>
    );
};
export default AppStage