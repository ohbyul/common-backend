import { Props } from "./props.dto";

class Sample {
    loginId: string;
    name: string;
    address: string;
}

export type SampleDto = Props<Sample>
