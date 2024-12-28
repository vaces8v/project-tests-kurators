import {create, StateCreator} from 'zustand'
import {persist} from 'zustand/middleware'

interface AlertStore {
    infoStudents: boolean;
}

interface ActionAlertStore {
    setInfoStudents: (value: boolean) => void;
}


const slice: StateCreator<AlertStore & ActionAlertStore, [["zustand/persist", unknown]]> = (set) => ({
    infoStudents: true,
    setInfoStudents: (value: boolean) => set({infoStudents: value})
})

export const useAlertsStore = create<AlertStore & ActionAlertStore, [["zustand/persist", unknown]]>(persist(slice, {name: 'alerts'}))