import { Transaction } from "sequelize";
import { RequestUserDto } from "../base/request.user.dto";

export class Props<T>{
    props?: T;
    user?: RequestUserDto;
    transaction: Transaction;
}


/********************************************
 * Why DTO? (not interface)
 *
 * TypeScript의 클래스는 JavaScript ES6 표준을 따른다.
 * TypeScript로 작성되었지만 컴파일 된 JavaScript에서는 인터페이스는 컴파일 도중 제거된다.
 * (Interface는 ES6 표준이 아니므로)
 * NestJS에서 런타임에 인터페이스를 참조할 수 없게된다.
 *
 * 따라서 NestJS에서는 런타임 이후
 * Input값에 대한 유효성 검증 혹은 그 외의 데이터 타입을 지속적으로 추적해야하는 경우
 * DTO는 Class로 작성되기에 ES6 표준이므로 참조가 가능 하지만,
 * Interface는 ES6 표준 문법이 아니므로 제거되기에 참조할 수 없게된다.
 *
 ********************************************/
// 1. class 사용 interface X
// 2. extends 사용시 {props , user , transaction } 형식 사용 불가
// 3. 공용 정적함수 common,module 넣어서 사용마 가능
