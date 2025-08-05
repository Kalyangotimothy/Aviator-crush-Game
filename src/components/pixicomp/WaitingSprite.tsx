import { Container, Sprite } from "@pixi/react"
import { dimensionType } from "../../@types"
import React, { useEffect, useState } from 'react'
import { interpolate, webpORpng } from "../../utils"
const WaitingSprite = ({ visible, dimension }: { visible: boolean, dimension: dimensionType }) => {
    const [rotate, setRotate] = useState(0)
    const [scale, setScale] = useState(0.5)
    const handleResize = () => {
        setScale(interpolate(window.innerWidth, 400, 1920, 1, 0.3))
    }
    useEffect(() => {
        setInterval(() => setRotate(prev => (prev + 1)), 100)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])
    return (
        <Container visible={visible} >
            <Sprite
                image={process.env.NODE_ENV === 'development' ? 
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K' : 
                    `${process.env.REACT_APP_ASSETS_IMAGE_URL}${webpORpng}/propeller.${webpORpng}`}
                anchor={0.5} scale={scale}
                x={dimension.width / 2} y={dimension.height / 2}
                rotation={rotate * 0.3}
            />
        </Container>
    )
}
export default WaitingSprite