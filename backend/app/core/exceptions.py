from fastapi import HTTPException, status


class InsufficientStockException(HTTPException):
    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Անբավարար մնացորդ '{product_name}' ապրանքի համար: Պահանջվում է {requested}, առկա է {available} հատ:"
        )


class PermissionDeniedException(HTTPException):
    def __init__(self, message: str = "Ձեզ արգելված է կատարել այս գործողությունը: Պահանջվում են լրացուցիչ իրավասություններ:"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )


class ResourceNotFoundException(HTTPException):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity} '{entity_id}' չի գտնվել համակարգում:"
        )
