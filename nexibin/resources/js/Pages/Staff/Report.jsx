import { useEffect, useState } from "react";
import StaffLayout from "@/Layouts/StaffLayout";

export default function Report() {

const [logs, setLogs] = useState([]);

useEffect(() => {

const storedLogs =
JSON.parse(localStorage.getItem("collectionLogs")) || [];

setLogs(storedLogs);

}, []);

/* CLEAR LOGS FUNCTION */
const clearLogs = () => {

const confirmClear = window.confirm(
"Are you sure you want to clear all collection logs?"
);

if(confirmClear){

localStorage.removeItem("collectionLogs");

setLogs([]);

}

};

return (

<StaffLayout>

<div className="p-6">

<div className="flex justify-between items-center mb-6">

<h1 className="text-2xl font-bold">
Collection Logs
</h1>

<button
onClick={clearLogs}
className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
>
Clear Logs
</button>

</div>

<div className="overflow-x-auto">

<table className="w-full border border-gray-300 text-center">

<thead>

<tr className="bg-gray-100 text-gray-700">

<th className="p-3 border">
Bin
</th>

<th className="p-3 border">
Location
</th>

<th className="p-3 border">
Time
</th>

<th className="p-3 border">
Status
</th>

</tr>

</thead>

<tbody>

{logs.length === 0 ? (

<tr>

<td colSpan="4" className="p-4 text-gray-500 border">

No logs yet

</td>

</tr>

) : (

logs.map((log, index) => (

<tr key={index} className="border hover:bg-gray-50">

<td className="p-3 border">
{log.bin}
</td>

<td className="p-3 border">
{log.location}
</td>

<td className="p-3 border">
{log.time}
</td>

<td className="p-3 border text-green-600 font-semibold">
{log.status}
</td>

</tr>

))

)}

</tbody>

</table>

</div>

</div>

</StaffLayout>

);
}