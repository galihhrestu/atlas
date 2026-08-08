import {useState} from "react";


function TimeFilter({onChange}){


const [period,setPeriod] = useState("1 Year");


const options=[

"1 Year",
"6 Month",
"3 Month",
"1 Month",
"2 Weeks",
"1 Week"

];



function handleChange(e){

setPeriod(e.target.value);

onChange(e.target.value);

}



return(

<select
className="time-filter"
value={period}
onChange={handleChange}
>


{
options.map(
(item)=>(

<option
key={item}
value={item}
>

{item}

</option>

)

)

}


</select>


)

}


export default TimeFilter;