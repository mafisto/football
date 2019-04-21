pragma solidity ^0.5.2;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract Football {
    using SafeMath for uint256;

    event BuyPlayerEvent(uint playerId, uint cost);
    event PrepareTransferEvent(uint playerId, uint price);


    uint[] private _playersIds;
    string[]  private _playerName;
    uint8[]  private _playerAge;
    mapping(uint => bool) private _playerInTransfer;

    mapping(uint => address payable) private _playersToOwner;
    mapping(address => uint) private _ownerPlayersCount;
    mapping(uint => uint) private _playersSellPrice;

    uint maxPlayersCount = 3;

    constructor() public {

    }
    //work
    function addPlayer(string memory _name, uint8 _age) public {
        require(_ownerPlayersCount[msg.sender] < maxPlayersCount);
        uint newPlayerId = _playersIds.length;
        _playersIds.push(newPlayerId);
        _playerName.push(_name);
        _playerAge.push(_age);
        _playerInTransfer[newPlayerId] = false;
        _playersSellPrice[newPlayerId] = 0 ether;

        _playersToOwner[newPlayerId] = msg.sender;
        _ownerPlayersCount[msg.sender] = _ownerPlayersCount[msg.sender].add(1);
    }

    // work
    function buyPlayer(uint _playerId) public payable {
        uint playerSellPrice = _playersSellPrice[_playerId];

        require(_ownerPlayersCount[msg.sender] < maxPlayersCount);
        require(isPlayerInTransfer(_playerId) == true);
        require(msg.value >= playerSellPrice);

        address payable _oldOwner = getPlayerOwner(_playerId);

        _playersToOwner[_playerId] = msg.sender;
        _playersSellPrice[_playerId] = 0 ether;
        _playerInTransfer[_playerId] = false;

        _oldOwner.transfer(msg.value);

        emit BuyPlayerEvent(_playerId, playerSellPrice);
    }

    function preparePlayerForTransfer(uint _playerId, uint _price) public _onlyPlayerOwner(_playerId) {
        require(isPlayerInTransfer(_playerId) == false);
        //        require(_ownerPlayersCount[msg.sender] > 0);

        _playersSellPrice[_playerId] = _price;
        _playerInTransfer[_playerId] = true;

        emit PrepareTransferEvent(_playerId, _price);
    }

    // work
    function isPlayerInTransfer(uint _playerId) public view returns (bool){
        return _playerInTransfer[_playerId];
    }

    // work
    function getPlayerSellPrice(uint _playerId) public view returns (uint){
        return _playersSellPrice[_playerId];
    }

    // work
    function getAllPlayers() public view returns (uint[] memory){
        return _playersIds;
    }

    // work
    function getPlayerOwner(uint _playerId) public view returns (address payable){
        return _playersToOwner[_playerId];
    }

    // work
    function getPlayersCount() public view returns (uint){
        return _ownerPlayersCount[msg.sender];
    }

    // work
    function getPlayerName(uint _playerId) public view returns (string memory){
        return _playerName[_playerId];
    }


    function getTest() public payable returns (uint[] memory){
        uint[] memory test = new uint[](3);
        test[0] = 1;
        test[1] = 2;
        test[2] = 3;
        return test;
    }

    modifier _onlyPlayerOwner(uint _playerId){
        require(_playersToOwner[_playerId] == msg.sender);
        _;

    }


}
