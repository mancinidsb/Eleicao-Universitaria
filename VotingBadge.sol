// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

///te
/// @title VotingBadge (soulbound ERC-721)
/// @notice Emite emblemas para eleitores; somente a chapa atual pode mintar.
contract VotingBadge is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public chapa_atual;

    constructor(address _chapa_atual) ERC721("VotingBadge", "VBG") {
        chapa_atual = _chapa_atual;
    }

    modifier apenasChapa() {
        require(msg.sender == chapa_atual, "Apenas a Chapa Atual (App) pode fazer isso");
        _;
    }

    /// @notice Mintar um emblema para `to`. Somente `chapa_atual` pode chamar.
    /// @return id do token criado
    function mintBadge(address to) external apenasChapa returns (uint256) {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        _safeMint(to, newId);
        return newId;
    }

    /// @notice Queimar um emblema (somente pela chapa atual)
    function burnBadge(uint256 tokenId) external apenasChapa {
        _burn(tokenId);
    }

    /// @dev Bloqueia transferências: permite apenas mint (from == 0x0) e burn (to == 0x0).
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        if (from != address(0) && to != address(0)) {
            revert("This token is non-transferable");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /// @dev Desabilita approvals para evitar que terceiros movam o token.
    function approve(address to, uint256 tokenId) public virtual override {
        revert("Approvals disabled");
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        revert("Approvals disabled");
    }
}
