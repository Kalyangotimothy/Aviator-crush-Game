import { Dispatch, SetStateAction, createContext, useContext, useState } from "react";
import { aviatorStateType } from "../@types";
const initValue: aviatorStateType = {
    token: "",
    socket: null,
    game_anim_status: "WAITING",
    dimension: {
        width: 1920,
        height: 630
    },
    auth: true,
    balance: process.env.NODE_ENV === 'development' ? 10000 : 0,
    autoPlayParams: [
        {
            nOfRounds: 0,
            stopIfarr: [0, 0, 0]
        },
        {
            nOfRounds: 0,
            stopIfarr: [0, 0, 0]
        }
    ],
    RemainedAutoPlayCount: [-1, -1],
}
const AviatorContext = createContext<{
    aviatorState: aviatorStateType,
    setAviatorState: Dispatch<SetStateAction<aviatorStateType>>
}>({
    aviatorState: initValue,
    setAviatorState: () => { }
})

const AviatorProvider = ({ children }: { children: React.ReactNode }) => {
    const [aviatorState, setAviatorState] = useState<aviatorStateType>(initValue)
    return (
        <AviatorContext.Provider value={{ aviatorState, setAviatorState }}>
            {children}
        </AviatorContext.Provider>
    )
}
const useAviator = () => useContext(AviatorContext)

export default AviatorProvider
export { useAviator }