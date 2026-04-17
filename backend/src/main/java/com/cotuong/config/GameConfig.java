package com.cotuong.config;

import com.cotuong.logic.ChineseChessPieceFactory;
import com.cotuong.logic.PieceFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GameConfig {
    @Bean
    public PieceFactory pieceFactory() {
        return new ChineseChessPieceFactory();
    }
}
