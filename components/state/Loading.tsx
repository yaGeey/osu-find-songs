'use client';
import Spinner from 'react-spinner-material';

export default function Loading({ color = '#888', radius = 40 }: { color?: string; radius?: number }) {
   return (
      <div className={`absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 [backdrop-filter:blur(1.5px)]`}>
         <Spinner radius={radius} color={color} stroke={3} visible={true} />
      </div>
   );
}
