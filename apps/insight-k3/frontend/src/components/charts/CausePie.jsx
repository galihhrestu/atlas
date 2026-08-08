import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";


const data = [
    {
        name:"Unsafe Action",
        value:8
    },
    {
        name:"Equipment Failure",
        value:5
    },
    {
        name:"Poor Housekeeping",
        value:3
    },
    {
        name:"PPE Violation",
        value:2
    },
    {
        name:"Weather",
        value:2
    }
];



const COLORS = [
    "#E53935",
    "#FB8C00",
    "#FDD835",
    "#43A047",
    "#1E88E5"
];



function CausePie(){


return(

<ResponsiveContainer width="100%" height={320}>


<PieChart>


<Pie
data={data}
cx="50%"
cy="50%"
outerRadius={110}
dataKey="value"
label
>


{
data.map(
(entry,index)=>(
<Cell
key={index}
fill={COLORS[index]}
/>
)
)
}


</Pie>



<Tooltip />

<Legend />


</PieChart>


</ResponsiveContainer>


)


}


export default CausePie;