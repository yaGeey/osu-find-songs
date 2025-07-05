// https://github.com/eligrey/FileSaver.js/issues/796 - xhr download progress
// TODO: xhr requests download progress add
// TODO with videos error fetching download
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export function download(blob: Blob, filename: string) {
   const url = window.URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.style.display = 'none';
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   window.URL.revokeObjectURL(url);
}

export const getNoVideo = async (id:number) => {
   const res = await fetch(`https://catboy.best/d/${id}`);
   if (!res.ok) throw new Error(await res.text());
   return res.blob();
}

export const getNoVideoAxios = async (id: number) => {
   const res = await axios.get(`https://catboy.best/d/${id}`, {
      responseType: 'blob',
   })
   return res.data
}
export const useNoVideoAxios = (id: number, filename: string) => {
   return useMutation({
      mutationFn: async () => {
         const res = await axios.get(`https://catboy.best/d/${id}`, {
            responseType: 'blob',
         })
         return res.data
      },
      onError: (error: any) => {
         console.error('Error downloading file:', error)
         toast.error('Error downloading file: ' + error.message)
      },
      onSuccess: (data: Blob) => {
         download(data, filename)
         toast.success('Downloaded successfully')
      },
   })
}

export const getVideo = async (id: number) => {
   const res = await fetch(`https://osu.ppy.sh/beatmapsets/${id}/download`);
   if (!res.ok) throw new Error(await res.text());
   return res.blob();
}

export const downloadNoVideo = async (id:number, filename: string) => {
   getNoVideo(id).then(blob => download(blob, filename));
}

export const downloadVideo = async (id:number, filename: string) => {
   getVideo(id).then(blob => download(blob, filename));
}


function downloadXhr(url: string, filename: string): void {
   let blob: Blob;
   const xhr = new XMLHttpRequest();
   xhr.open('GET', url, true);
   xhr.responseType = 'blob';
   xhr.onload = function (e): void {
      blob = new Blob([this.response]);
   };
   xhr.onprogress = function (pr): void {
      console.log(pr.loaded / pr.total);
   };
   xhr.onloadend = function (e): void {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
   };
   xhr.send();
}
export const downloadNoVideoXhr = async (id:number, filename: string) => {
   const res = downloadXhr(`https://catboy.best/d/${id}`, filename);
   console.log(res);
}