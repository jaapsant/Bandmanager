import { createContext, useContext, ReactNode } from 'react';

interface Member {
  id: string;
  name: string;
}

interface MemberContextType {
  members: Member[];
}

const MemberContext = createContext<MemberContextType>({ members: [] });

export function MemberProvider({ children }: { children: ReactNode }) {
  // Add your member state management here
  const members: Member[] = [];

  return (
    <MemberContext.Provider value={{ members }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMembers() {
  return useContext(MemberContext);
} 